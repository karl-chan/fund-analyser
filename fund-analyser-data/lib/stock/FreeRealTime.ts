
import { Promise } from 'bluebird'
import * as _ from 'lodash'
import moment from 'moment'
import puppeteer, { Browser } from 'puppeteer'
import Semaphore from 'semaphore-async-await'
import Http from '../util/http'
import log from '../util/log'
import * as properties from '../util/properties'
import * as streamWrapper from '../util/streamWrapper'
import Stock from './Stock'
import { StockProvider } from './StockFactory'

interface Token {
    quote: string
    timeAndSales: string
    profile: string
    historical: string
    expiry: Date
}

const http = new Http({
  headers: {
    origin: 'https://quotes.freerealtime.com'
  }
})

const mutex = new Semaphore(1)
let token: Token

export default class FreeRealTime implements StockProvider {
  maxLookbackYears: number

  constructor () {
    this.maxLookbackYears = properties.get('stock.max.lookback.years')
  }

  async getStockFromSymbol (symbol: string) {
    const [summary, historicPrices, realTimeDetails] = await Promise.all([
      this.getSummary(symbol),
      this.getHistoricPrices(symbol),
      this.getRealTimeDetails(symbol)
    ])
    return Stock.builder(symbol)
      .name(summary.name)
      .historicPrices(historicPrices)
      .asof(_.isEmpty(historicPrices) ? undefined : _.last(historicPrices).date)
      .realTimeDetails(realTimeDetails)
      .marketCap(summary.marketCap)
      .build()
  }

  async getStocksFromSymbols (isins: string[]) {
    return Promise.map(isins, isin => this.getStockFromSymbol(isin))
  }

  async getSummary (symbol: string) {
    try {
      const url = 'https://app.quotemedia.com/datatool/getProfiles.json'
      const { data } = await http.asyncGet(url, {
        params: {
          symbols: symbol,
          token: (await this.getToken()).profile
        },
        responseType: 'json'
      })
      const { profile, symbolinfo } = data.results.company[0]
      const name = symbolinfo[0].equityinfo.longname
      const marketCap = profile.details.marketcap

      return {
        name,
        marketCap
      }
    } catch (err) {
      log.warn('Failed to retrieve FreeRealTime summary for symbol: %s. Cause: %s', symbol, err.stack)
      return {}
    }
  }

  async getHistoricPrices (symbol: string) {
    try {
      const url = 'https://app.quotemedia.com/datatool/getFullHistory.json'
      const { data } = await http.asyncGet(url, {
        params: {
          symbol: symbol,
          start: moment.utc().subtract(this.maxLookbackYears, 'years').format('YYYY-MM-DD'),
          end: moment.utc().format('YYYY-MM-DD'),
          token: (await this.getToken()).historical
        },
        responseType: 'json'
      })
      const historicPrices: Stock.HistoricPrice[] =
        data.results.history[0].eoddata
          .reverse()
          .map((row: any) => {
            const date = moment.utc(row.date, 'YYYY-MM-DD').toDate()
            const close = +row.close
            const volume = +row.sharevolume
            return new Stock.HistoricPrice(date, close, volume)
          })
      return historicPrices
    } catch (err) {
      log.warn('Failed to retrieve FreeRealTime historic prices for symbol: %s. Cause: %s', symbol, err.stack)
      return []
    }
  }

  async getRealTimeDetails (symbol: string) {
    try {
      const [{ data: res1 }, { data: res2 }] = await Promise.all([
        http.asyncGet(
          'https://app.quotemedia.com/datatool/getEnhancedQuotes.json',
          {
            params: {
              symbols: symbol,
              token: (await this.getToken()).quote
            },
            responseType: 'json'
          }),
        http.asyncGet(
          'https://app.quotemedia.com/datatool/getRecentTradesBySymbol.json',
          {
            params: {
              symbol: symbol,
              limit: 1000,
              token: (await this.getToken()).timeAndSales
            },
            responseType: 'json'
          })])

      const priceData = res1.results.quote[0].pricedata
      const estPrice = +priceData.last
      const estChange = +priceData.changepercent / 100

      const tradeRows = res2.results.trades.trade
      const tradeTimeGaps: number[] = _.zip(tradeRows.slice(0, -1), _.tail(tradeRows))
        .map(([row1, row2]: any) => moment(row1.datetime).diff(moment(row2.datetime), 'seconds'))
      const longestTimeGap = _.max(tradeTimeGaps)

      const tradePriceMovements: number[] = _.zip(tradeRows.slice(0, -1), _.tail(tradeRows))
        .map(([row1, row2]: any) => {
          const p1 = row1.price
          const p2 = row2.price
          const absDiff = Math.abs(p1 - p2)
          const midPrice = (p1 + p2) / 2
          const pctMovement = absDiff / midPrice
          return pctMovement
        })
      const bidAskSpread = _.max(tradePriceMovements)

      return {
        estPrice,
        estChange,
        bidAskSpread,
        longestTimeGap,
        lastUpdated: new Date()
      }
    } catch (err) {
      log.warn('Failed to retrieve FreeRealTime bid-ask spread for symbol: %s. Cause: %s', symbol, err.stack)
      return undefined
    }
  }

  private async getToken (): Promise<Token> {
    // double checked locking
    if (!token || moment.utc().isAfter(token.expiry)) {
      log.debug('Awaiting lock')
      await mutex.acquire()
      try {
        if (!token || moment.utc().isAfter(token.expiry)) {
          token = await this.refreshToken()
        }
      } finally {
        mutex.release()
      }
    }
    return token
  }

  private async refreshToken (): Promise<Token> {
    let browser: Browser
    let localStorage: any

    try {
      log.debug('Launching puppeteer')
      const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ],
        headless: true
      })
      const page = await browser.newPage()
      page.setDefaultNavigationTimeout(0)
      log.debug('Opened new page')

      await page.goto('https://quotes.freerealtime.com/quotes/AAPL/Quote', { waitUntil: 'networkidle2' })
      log.debug('Opened quote page')
      await page.goto('https://quotes.freerealtime.com/quotes/AAPL/Time%26Sales', { waitUntil: 'networkidle2' })
      log.debug('Opened time&sales page')
      await page.goto('https://quotes.freerealtime.com/quotes/AAPL/Profile', { waitUntil: 'networkidle2' })
      log.debug('Opened profile page')
      await page.goto('https://quotes.freerealtime.com/quotes/AAPL/Historical', { waitUntil: 'networkidle2' })
      log.debug('Opened historical page')

      await page.waitForTimeout(1000)

      localStorage = await page.evaluate(() => Object.assign({}, window.localStorage))
    } finally {
      if (browser) {
        await browser.close()
      }
      log.debug('Closed browser')
    }

    const { value: quote, expires_at: quoteExpiry } = JSON.parse(localStorage.app_100804_DetailedQuoteTab)
    const { value: profile, expires_at: profileExpiry } = JSON.parse(localStorage.app_100804_CompanyProfile)
    const { value: historical, expires_at: historicalExpiry } = JSON.parse(localStorage.app_100804_PriceHistory)
    const { value: timeAndSales, expires_at: timeAndSalesExpiry } = JSON.parse(localStorage.app_100804_TradesHistorical)

    const token = {
      quote,
      timeAndSales,
      profile,
      historical,
      expiry: moment.utc(
        _.min([
          quoteExpiry,
          profileExpiry,
          historicalExpiry,
          timeAndSalesExpiry
        ])
      ).toDate()
    }
    log.info('Refreshed free real time token: %j', token)
    return token
  }

  /**
   * Analogous stream methods below
   */
  streamStocksFromSymbols () {
    return streamWrapper.asParallelTransformAsync((symbol: string) => this.getStockFromSymbol(symbol))
  }
}
