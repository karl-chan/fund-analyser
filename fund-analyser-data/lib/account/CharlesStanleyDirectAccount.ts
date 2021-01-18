import * as cheerio from 'cheerio'
import * as _ from 'lodash'
import moment from 'moment'
import { CookieJar } from 'request'
import * as url from 'url'
import * as FundDAO from '../db/FundDAO'
import Fund from '../fund/Fund'
import { Action, Buy } from '../trade/Action'
import * as fundUtils from '../util/fundUtils'
import Http from '../util/http'
import * as lang from '../util/lang'
import log from '../util/log'
import * as math from '../util/math'
import * as properties from '../util/properties'

const http = new Http()

export interface Balance {
    portfolio: number
    cash: number
    totalValue: number
    holdings: any[]
}

export interface Order {
            orderRef: string
            side: string
            sedol: string
            name: string
            quantity: number
            status: string
            settlementDate: Date
            orderDate: Date
            price: string
            consideration: string
            fundDealingFee: number
            other: string
            estimatedProceeds: number
          }

export interface Transaction {
          date: Date
          description: string
          stockDescription: string
          sedol: string
          contractReference: string
          price: number
          debit: number
          credit: number
          settlementDate: Date
          cash: number
}

export interface Statement {
  series: any[]
  events: any[]
  returns: object
}
export default class CharlesStanleyDirectAccount {
    fundTradeEntryUrl: string;
    fundTradeVerifyPlaceOrderUrl: string;
    jar: CookieJar;
    lookbacks: string[];
    orderListUrl: string;
    pass: string;
    portfolioValuationUrl: string;
    statementUrl: string;
    tradeInstrumentUrl: string;
    constructor (jar?: CookieJar, pass?: string) {
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

    async getBalance () : Promise<Balance> {
      const { body } = await http.asyncGet(this.portfolioValuationUrl, { jar: this.jar })
      const $ = cheerio.load(body)
      const portfolio = lang.parseNumber($('#vacc-portfolio td > span').text())
      const cash = lang.parseNumber($('#vacc-cash td > span').text())
      const totalValue = lang.parseNumber($('#vacc-total td > span').text())

      const matches = body.match(/CS\.portStreamingData = (.*);/)
      const holdings = matches ? JSON.parse(matches[1]) : []
      return { portfolio, cash, totalValue, holdings }
    }

    async getOrders (): Promise<Order[]> {
      const { body } = await http.asyncGet(this.orderListUrl, { jar: this.jar })
      const $ = cheerio.load(body)
      const rows = $('#ordl-results > tbody > tr').get()
      const orders = _.chunk(rows, 2)
        .map(([summaryRow, orderDetails]) => {
          const [orderRef, side, sedol, name, quantity] =
                    $(summaryRow)
                      .children('td')
                      .map((i: any, td: any) => $(td).text().trim())
                      .get()
          const settlementDate = $(orderDetails).find('th:contains(\'Settlement Date\') + td').text().trim()
          const orderDate = $(orderDetails).find('th:contains(\'Order Date\') + td').text().trim()
          const status = $(orderDetails).find('th:contains(\'Status\') + td').text().trim()
          const price = $(orderDetails).find('th:contains(\'Price\') + td').text().trim()
          const consideration = $(orderDetails).find('th:contains(\'Consideration\') + td').text().trim()
          const fundDealingFee = $(orderDetails).find('th:contains(\'Fund Dealing Fee\') + td').text().trim()
          const other = $(orderDetails).find('th:contains(\'Other\') + td').text().trim()
          const estimatedProceeds = $(orderDetails).find('th:contains(\'Estimated\') + td').text().trim()
          return {
            orderRef,
            side,
            sedol,
            name,
            quantity: lang.parseNumber(quantity),
            status,
            settlementDate: moment(settlementDate, 'DD MMM YYYY').toDate(),
            orderDate: moment(orderDate, 'DD MMM YYYY').toDate(),
            price,
            consideration,
            fundDealingFee: lang.parseNumber(fundDealingFee.replace(/£/g, '')),
            other,
            estimatedProceeds: lang.parseNumber(estimatedProceeds.replace(/£/g, ''))
          }
        })
      return orders
    }

    async getTransactions () :Promise<Transaction[]> {
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
      return rows.map((row: any) => {
        const [date, description, stockDescription, sedol, contractReference, price, debit, credit, settlementDate, balance] = $(row).children().map((i: any, el: any) => $(el).text().trim()).get()
        return {
          date: moment.utc(date, 'DD MMM YYYY').toDate(),
          description,
          stockDescription,
          sedol,
          contractReference,
          price: lang.parseNumber(price),
          debit: lang.parseNumber(debit),
          credit: lang.parseNumber(credit),
          settlementDate: moment.utc(settlementDate, 'DD MMM YYYY').toDate(),
          cash: lang.parseNumber(balance) * (balance.endsWith('cr') ? 1 : -1)
        }
      })
    }

    /**
     * Return {series: [Fund.HistoricPrice], events: [
     *  {type: 'fund', from: Date, to: Date, holdings: [{sedol: string, weight: number}]},
     *  {type: 'fee', date: Date, value: number},
     *  {type: 'deposit', date: Date, value: number},
     *  {type: 'withdrawal', date: Date, value: number},
     * ]}
     */
    async getStatement (): Promise<Statement> {
      const today = moment.utc().startOf('day')
      const transactions = await this.getTransactions()

      // get historic price data
      const sedols = _.uniq(transactions.map((transaction: any) => transaction.sedol).filter((x: any) => x))
      const sedolToFund = _.keyBy(await FundDAO.listFunds({
        query: { sedol: { $in: sedols } }
      }, true), (f: any) => f.sedol)

      const priceCorrection = (csdPrice: any, date: any, sedol: any) => {
        // For some reason price difference between charles stanley and financial times could be 100x
        const fund = sedolToFund[sedol]
        const ftPrice = fundUtils.closestRecordBeforeDate(date, fund.historicPrices).price
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
      const carryThroughHoldings: { [sedol: string]: number } = {} // {sedol: numShares}

      for (const [i, transaction] of transactions.entries()) {
        const { date, description, sedol, price, debit, credit, cash } = transaction
        const nextDate = i + 1 < transactions.length ? moment.utc(transactions[i + 1].date) : today
        switch (description) {
          case 'Stocks & Shares Subs':
            if (credit) {
              events.push({ type: 'deposit', date: date, value: credit })
            } else {
              events.push({ type: 'withdrawal', date: date, value: debit })
            }
            break
          case 'Funds Platform Fee':
            events.push({ type: 'fee', date: date, value: debit })
            break
          default: {
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

            if (i + 1 < transactions.length && nextDate.isSame(date) && transactions[i + 1].sedol) {
              continue // batch all transactions on the same day
            }
          }
        }

        // push event
        if (Object.keys(carryThroughHoldings).length > 0) {
          const sedolToValue = {}
          let totalHoldingsValue = 0
          for (const [sedol, numShares] of Object.entries(carryThroughHoldings)) {
            const fund = sedolToFund[sedol]
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            sedolToValue[sedol] = numShares * fundUtils.closestRecordBeforeDate(date, fund.historicPrices).price
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            totalHoldingsValue += sedolToValue[sedol]
          }
          const holdings = Object.entries(sedolToValue).map(([sedol, holdingValue]) => {
            const fund = sedolToFund[sedol]
            // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
            return { sedol, name: fund.name, isin: fund.isin, weight: holdingValue / totalHoldingsValue }
          })
          events.push({ type: 'fund', from: date, to: nextDate.toDate(), holdings })
        }

        // push account worth day by day
        for (const day = moment.utc(date); day.isBefore(nextDate); day.add(1, 'day')) {
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
    async tradeFund (action: Action) {
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
          'FormModel.IsKeyDocumentTicked': true,
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
      const orderReference = $3('th:contains(\'Order Reference\') + td').text().trim()
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

    async _getHistoricPrices (sedols: any) {
      const docs = await FundDAO.listFunds({
        query: { sedol: { $in: sedols } },
        projection: { sedol: 1, historicPrices: 1 }
      }, true)
      return _.fromPairs(docs.map((doc: any) => [doc.sedol, doc.historicPrices]))
    }
}
