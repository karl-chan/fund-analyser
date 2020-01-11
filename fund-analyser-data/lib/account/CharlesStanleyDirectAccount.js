const cheerio = require('cheerio')
const _ = require('lodash')
const moment = require('moment')
const url = require('url')

const Http = require('../util/http')
const lang = require('../util/lang')
const log = require('../util/log')
const math = require('../util/math')
const properties = require('../util/properties')
const fundUtils = require('../util/fundUtils')
const FundDAO = require('../db/FundDAO')
const Fund = require('../fund/Fund')
const { Buy } = require('../trade/Action')

const http = new Http()

class CharlesStanleyDirectAccount {
    constructor (jar, pass) {
        if (!jar) {
            throw new Error('Missing jar')
        }
        if (!pass) {
            throw new Error('Missing pass')
        }
        this.jar = jar
        this.pass = pass
        this.portfolioValuationUrl = 'https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts/Portfolio_Valuation'
        this.orderListUrl = 'https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts/Portfolio_Valuation/Order_List'
        this.statementUrl = 'https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts/Portfolio_Valuation/Statement'
        this.tradeInstrumentUrl = ' https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts/Portfolio_Valuation/TradeInstrument'

        // trade operations
        this.fundTradeEntryUrl = 'https://www.charles-stanley-direct.co.uk/Trading/FundTradeEntry'
        this.fundTradeVerifyPlaceOrderUrl = 'https://www.charles-stanley-direct.co.uk/Trading/FundTradeVerifyPlaceOrder'

        this.lookbacks = properties.get('fund.lookbacks')
    }

    async getBalance () {
        const { body } = await http.asyncGet(this.portfolioValuationUrl, { jar: this.jar })
        const $ = cheerio.load(body)
        const portfolio = lang.parseNumber($('#vacc-portfolio td > span').text())
        const cash = lang.parseNumber($('#vacc-cash td > span').text())
        const totalValue = lang.parseNumber($('#vacc-total td > span').text())

        const matches = body.match(/CS\.portStreamingData = (.*);/)
        const holdings = matches ? JSON.parse(matches[1]) : []
        return { portfolio, cash, totalValue, holdings }
    }

    async getOrders () {
        const { body } = await http.asyncGet(this.orderListUrl, { jar: this.jar })
        const $ = cheerio.load(body)
        const rows = $('#ordl-results > tbody > tr').get()
        const orders = _.chunk(rows, 2)
            .map(([summaryRow, orderDetails]) => {
                const [orderRef, side, sedol, name, quantity, status] =
                    $(summaryRow)
                        .children('td')
                        .map((i, td) => $(td).text().trim())
                        .get()
                const [,, settlementDate, orderDate,, price,, consideration, fundDealingFee, other, estimatedProceeds] =
                    $(orderDetails)
                        .find('.ordl-subtable > tbody > tr > td')
                        .map((i, e) => $(e).text().trim())
                        .get()
                return {
                    orderRef,
                    side,
                    sedol,
                    name,
                    quantity: lang.parseNumber(quantity),
                    status,
                    settlementDate: moment(settlementDate, 'DD MMM YYYY'),
                    orderDate: moment(orderDate, 'DD MMM YYYY'),
                    price,
                    consideration,
                    fundDealingFee: lang.parseNumber(fundDealingFee.replace(/£/g, '')),
                    other,
                    estimatedProceeds: lang.parseNumber(estimatedProceeds.replace(/£/g, ''))
                }
            })
        return orders
    }

    /**
     * Return {series: [Fund.HistoricPrice], events: [
     *  {type: 'fund', from: Date, to: Date, holdings: [{sedol: string, weight: number}]},
     *  {type: 'fee', date: Date, value: number},
     *  {type: 'deposit', date: Date, value: number},
     *  {type: 'withdrawal', date: Date, value: number},
     * ]}
     */
    async getStatement () {
        const today = moment.utc().startOf('day')
        const accountCode = await this.getAccountCode()
        const qs = {
            AccountCode: accountCode,
            capital: true,
            income: true,
            searchType: 'period',
            DateFromDay: 1,
            DateFromMonth: 1,
            DateFromYear: 2000,
            DateToDay: today.date(),
            DateToMonth: today.month() + 1,
            DateToYear: today.year(),
            pageSize: 10000000
        }
        const { body: b2 } = await http.asyncGet(`${this.statementUrl}/Search`, { jar: this.jar, qs })
        const $ = cheerio.load(b2)
        const rows = $('#vac-stmt-table > tbody > tr:not(.blue-row)').get().reverse().slice(1) // remove first row (* BALANCE B/F *)
        if (!rows.length) {
            return []
        }

        // get historic price data
        const sedols = _.uniq(rows.map(row => $(row).children().eq(3).text()).filter(x => x))
        const sedolToFund = _.keyBy(await FundDAO.listFunds({
            query: { sedol: { $in: sedols } }
        }, true), f => f.sedol)

        const decodeRow = (row) => {
            const [ date, description, stockDescription, sedol, contractReference, price, debit, credit, settlementDate, balance ] = $(row).children().map((i, el) => $(el).text().trim()).get()
            return {
                date: moment.utc(date, 'DD MMM YYYY'),
                description,
                stockDescription,
                sedol,
                contractReference,
                price: lang.parseNumber(price),
                debit: lang.parseNumber(debit),
                credit: lang.parseNumber(credit),
                settlementDate: moment.utc(settlementDate, 'DD MMM YYYY'),
                cash: lang.parseNumber(balance) * (balance.endsWith('cr') ? 1 : -1)
            }
        }

        const priceCorrection = (csdPrice, date, sedol) => {
            // For some reason price difference between charles stanley and financial times could be 100x
            const fund = sedolToFund[sedol]
            const ftPrice = fundUtils.closestRecordBeforeDate(date.toDate(), fund.historicPrices).price
            if (math.roughEquals(ftPrice, csdPrice * 100, 2)) {
                return csdPrice * 100
            }
            if (math.roughEquals(ftPrice, csdPrice, 2)) {
                return csdPrice
            }
            console.log('FT: ' + ftPrice + ' CSD: ' + csdPrice + ' Date: ' + date)
            return ftPrice
        }

        const series = []
        const events = []
        let carryThroughHoldings = {} // {sedol: numShares}

        for (const [i, row] of rows.entries()) {
            const { date, description, sedol, price, debit, credit, cash } = decodeRow(row)
            const nextDate = i + 1 < rows.length ? decodeRow(rows[i + 1]).date : today
            switch (description) {
            case 'Stocks & Shares Subs':
                if (credit) {
                    events.push({ type: 'deposit', date: date.toDate(), value: credit })
                } else {
                    events.push({ type: 'withdrawal', date: date.toDate(), value: debit })
                }
                break
            case 'Funds Platform Fee':
                events.push({ type: 'fee', date: date.toDate(), value: debit })
                break
            default:
                // stock holding
                const correctPrice = priceCorrection(price, date, sedol)
                if (credit) {
                    math.roughEquals(carryThroughHoldings[sedol], credit / correctPrice)
                        ? delete carryThroughHoldings[sedol]
                        : carryThroughHoldings[sedol] -= credit / correctPrice
                }
                if (debit) {
                    carryThroughHoldings[sedol] = (carryThroughHoldings[sedol] || 0) + debit / correctPrice
                }

                if (i + 1 < rows.length && nextDate.isSame(date) && decodeRow(rows[i + 1]).sedol) {
                    continue // batch all transactions on the same day
                }
            }

            // push event
            if (Object.keys(carryThroughHoldings).length > 0) {
                const sedolToValue = {}
                let totalHoldingsValue = 0
                for (let [sedol, numShares] of Object.entries(carryThroughHoldings)) {
                    const fund = sedolToFund[sedol]
                    sedolToValue[sedol] = numShares * fundUtils.closestRecordBeforeDate(date.toDate(), fund.historicPrices).price
                    totalHoldingsValue += sedolToValue[sedol]
                }
                const holdings = Object.entries(sedolToValue).map(([sedol, holdingValue]) => {
                    const fund = sedolToFund[sedol]
                    return { sedol, name: fund.name, isin: fund.isin, weight: holdingValue / totalHoldingsValue }
                })
                events.push({ type: 'fund', from: date.toDate(), to: nextDate.toDate(), holdings })
            }

            // push account worth day by day
            for (const day = date; day.isBefore(nextDate); day.add(1, 'day')) {
                const weekday = day.day()
                if (weekday === 0 || weekday === 6) {
                    continue // skip weekends
                }
                const currDate = day.toDate()
                const holdingsValue = _.sumBy(Object.entries(carryThroughHoldings), ([sedol, numShares]) => {
                    const fund = sedolToFund[sedol]
                    const fundPrice = fundUtils.closestRecordBeforeDate(currDate, fund.historicPrices).price
                    return numShares * fundPrice
                })
                const value = cash + holdingsValue
                series.push(new Fund.HistoricPrice(currDate, +value.toFixed(2)))
            }
        }

        const returns = fundUtils.enrichReturns({}, series, this.lookbacks)
        return { series, events, returns }
    }

    /**
      * Trade a fund.
      * @param {*} action a Buy / Sell action from lib/trade/Action.js
      * @returns {string} the 11-character order reference for the successful trade
      */
    async tradeFund (action) {
        // Trade entry page
        const { body: b1 } = await http.asyncGet(this.tradeInstrumentUrl, {
            jar: this.jar,
            qs: {
                id: action.sedol,
                Type: 'FUND',
                actionType: action instanceof Buy ? 'buy' : 'sell'
            }
        })
        const $1 = cheerio.load(b1)
        const entryForm = $1('form[action*="FundTradeEntry"]')
        const matches1 = entryForm.attr('action').match(/.*TradeRequestId=(.+)/)
        if (!matches1) {
            throw new Error('Failed to parse FundTradeEntry TradeRequestId!')
        }
        const entryTradeRequestId = matches1[1]
        const entryRequestVerificationToken = entryForm.find('input[name="__RequestVerificationToken"]').attr('value')

        // Trade verify page
        const { body: b2 } = await http.asyncPost(this.fundTradeEntryUrl, {
            jar: this.jar,
            followAllRedirects: true,
            qs: {
                TradeRequestId: entryTradeRequestId
            },
            form: {
                __RequestVerificationToken: entryRequestVerificationToken,
                'FormModel.QuantitySpecified': 'value',
                'FormModel.TradeValue': action instanceof Buy ? action.value : action.quantity,
                'FormModel.IsIllustrationOfChargesTicked': true,
                'FormModel.Password': this.pass
            }
        })
        const $2 = cheerio.load(b2)
        const err = $2('li.error-message[style*="display:list-item;"]').text()
        if (err) {
            throw new Error(`Failed to trade instrument. Reason: ${err}`)
        }
        const verifyForm = $2('form[action*="FundTradeVerifyPlaceOrder"]')
        const matches2 = verifyForm.attr('action').match(/.*TradeRequestId=(.+)/)
        if (!matches2) {
            throw new Error('Failed to parse FundTradeVerifyPlaceOrder TradeRequestId!')
        }
        const verifyTradeRequestId = matches2[1]
        const verifyRequestVerificationToken = verifyForm.find('input[name="__RequestVerificationToken"]').attr('value')

        // Trade confirmation page
        const { body: b3 } = await http.asyncPost(this.fundTradeVerifyPlaceOrderUrl, {
            jar: this.jar,
            followAllRedirects: true,
            qs: {
                TradeRequestId: verifyTradeRequestId
            },
            form: {
                __RequestVerificationToken: verifyRequestVerificationToken
            }
        })
        const $3 = cheerio.load(b3)
        const orderReference = $3(`th:contains('Order Reference') + td`).text().trim()
        if (!orderReference) {
            throw new Error('Failed to obtain order reference!')
        }
        log.debug(`Executed action: ${JSON.stringify(action)}. Order reference: ${orderReference}`)
        return orderReference
    }

    async getAccountCode () {
        const { headers: h1 } = await http.asyncGet(this.statementUrl, { jar: this.jar, followRedirect: false })
        if (!h1.location || !h1.location.includes('AccountCode')) {
            throw new Error('Failed to get account number in statement query')
        }
        return new url.URLSearchParams(h1.location.split('?')[1]).get('AccountCode')
    }

    async _getHistoricPrices (sedols) {
        const docs = await FundDAO.listFunds({
            query: { sedol: { $in: sedols } },
            projection: { sedol: 1, historicPrices: 1 }
        }, true)
        return _.fromPairs(docs.map(doc => [doc.sedol, doc.historicPrices]))
    }
}

module.exports = CharlesStanleyDirectAccount
