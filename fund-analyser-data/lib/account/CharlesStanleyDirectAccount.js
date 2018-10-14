const cheerio = require('cheerio')
const _ = require('lodash')
const moment = require('moment')
const url = require('url')

const Http = require('../util/http')
const lang = require('../util/lang')
const math = require('../util/math')
const properties = require('../util/properties')
const fundUtils = require('../util/fundUtils')
const FundDAO = require('../db/FundDAO')
const Fund = require('../fund/Fund')

const http = new Http()

class CharlesStanleyDirectAccount {
    constructor (jar) {
        if (!jar) {
            throw new Error('Missing jar')
        }
        this.jar = jar
        this.portfolioValuationUrl = 'https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts/Portfolio_Valuation'
        this.statementUrl = 'https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts/Portfolio_Valuation/Statement'

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
