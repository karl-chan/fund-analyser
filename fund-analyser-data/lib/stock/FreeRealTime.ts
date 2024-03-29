
import { Promise } from 'bluebird'
import * as _ from 'lodash'
import moment from 'moment-business-days'
import puppeteer, { Browser } from 'puppeteer'
import Semaphore from 'semaphore-async-await'
import TokenDAO from '../db/TokenDAO'
import Http from '../util/http'
import log from '../util/log'
import * as properties from '../util/properties'
import * as streamWrapper from '../util/streamWrapper'
import Stock from './Stock'
import { StockProvider } from './StockFactory'

export interface Token {
  quote: string
  timeAndSales: string
  profile: string
  historical: string
  miniFundamentals: string
  expiry: Date
}

const http = new Http({
  headers: {
    origin: 'https://quotes.freerealtime.com'
  }
})

export default class FreeRealTime implements StockProvider {
  maxLookbackYears: number
  cachedToken: Token
  mutex : Semaphore

  constructor () {
    this.maxLookbackYears = properties.get('stock.max.lookback.years')
    this.mutex = new Semaphore(1)
  }

  async getStockFromSymbol (symbol: string) {
    const [summary, historicPrices] = await Promise.all([
      this.getSummary(symbol),
      this.getHistoricPrices(symbol)
    ])
    return Stock.builder(symbol)
      .name(summary.name)
      .historicPrices(historicPrices)
      .asof(_.isEmpty(historicPrices) ? undefined : _.last(historicPrices).date)
      .realTimeDetails(summary.realTimeDetails)
      .fundamentals(summary.fundamentals)
      .build()
  }

  async getStocksFromSymbols (symbols: string[]) {
    return Promise.map(symbols, symbol => this.getStockFromSymbol(symbol))
  }

  async getSummary (symbol: string) {
    try {
      const [{ data: res1 }, { data: res2 }, { data: res3 }] = await Promise.all([
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
              symbol,
              limit: 1000,
              token: (await this.getToken()).timeAndSales
            },
            responseType: 'json'
          }),
        http.asyncGet(
          'https://app.quotemedia.com/datatool/getFundamentals.json',
          {
            params: {
              symbols: symbol,
              token: (await this.getToken()).miniFundamentals
            },
            responseType: 'json'
          })])

      const quote = res1.results.quote[0]
      const name = quote.equityinfo.longname
      const marketCap = +quote.fundamental?.marketcap
      const beta = +quote.fundamental?.beta
      const eps = +quote.fundamental?.eps
      const pbRatio = +quote.fundamental?.pbratio
      const peRatio = +quote.fundamental?.peratio
      const yld = quote.fundamental?.dividend?.yield / 100

      const priceData = quote.pricedata
      const estPrice = +priceData.last
      const estChange = +priceData.changepercent / 100

      const tradeRows = res2.results.trades.trade
      const tradeTimeGaps: number[] = _.zip(tradeRows.slice(0, -1), _.tail(tradeRows))
        .map(([row1, row2]: any) => moment(row1.datetime).diff(moment(row2.datetime), 'seconds'))
      const longestTimeGap = _.max(tradeTimeGaps)

      const company = res3.results.company[0]
      const psRatio = +company.fundamental?.pricetosales

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
        name,
        realTimeDetails: {
          estPrice,
          estChange,
          bidAskSpread,
          longestTimeGap,
          lastUpdated: new Date()
        },
        fundamentals: {
          marketCap,
          beta,
          eps,
          pbRatio,
          peRatio,
          psRatio,
          yld
        }
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
          start: moment.utc()
            .subtract(this.maxLookbackYears, 'years')
            .subtract(1, 'week') // add one more week of leeway for calculating 5Y returns
            .format('YYYY-MM-DD'),
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

  private async getToken (): Promise<Token> {
    // double checked locking
    if (!this.cachedToken || moment.utc().isAfter(this.cachedToken.expiry)) {
      log.debug('Awaiting lock')
      await this.mutex.acquire()
      try {
        if (!this.cachedToken || moment.utc().isAfter(this.cachedToken.expiry)) {
          this.cachedToken = await TokenDAO.getFreeRealTimeToken()
          log.debug('Got free real time token: %j', this.cachedToken)
        }
      } finally {
        this.mutex.release()
      }
    }
    return this.cachedToken
  }

  async fetchToken (): Promise<Token> {
    let browser: Browser
    let localStorage: any

    try {
      log.info('Launching puppeteer')
      const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--blink-settings=imagesEnabled=false',
          '--proxy-server="direct://"',
          '--proxy-bypass-list=*'
        ],
        headless: true
      })
      const page = await browser.newPage()
      page.setDefaultNavigationTimeout(2 * 60 * 1000) // 2 minutes

      await page.goto('https://quotes.freerealtime.com/quotes/AAPL/Quote', { waitUntil: 'networkidle2' })
      log.info('Opened quote page')
      await page.goto('https://quotes.freerealtime.com/quotes/AAPL/Time%26Sales', { waitUntil: 'networkidle2' })
      log.info('Opened time&sales page')
      await page.goto('https://quotes.freerealtime.com/quotes/AAPL/Profile', { waitUntil: 'networkidle2' })
      log.info('Opened profile page')
      await page.goto('https://quotes.freerealtime.com/quotes/AAPL/Historical', { waitUntil: 'networkidle2' })
      log.info('Opened historical page')

      await page.waitForTimeout(1000)

      localStorage = await page.evaluate(() => Object.assign({}, window.localStorage))
    } finally {
      if (browser) {
        await browser.close()
      }
      browser = undefined
      log.info('Closed puppeteer')
    }

    const { value: quote, expires_at: quoteExpiry } = JSON.parse(localStorage.app_100804_DetailedQuoteTab)
    const { value: profile, expires_at: profileExpiry } = JSON.parse(localStorage.app_100804_CompanyProfile)
    const { value: historical, expires_at: historicalExpiry } = JSON.parse(localStorage.app_100804_PriceHistory)
    const { value: timeAndSales, expires_at: timeAndSalesExpiry } = JSON.parse(localStorage.app_100804_TradesHistorical)
    const { value: miniFundamentals, expires_at: miniFundamentalsExpiry } = JSON.parse(localStorage.app_100804_MiniFundamentals)
    const { value: miniQuotes, expires_at: miniQuotesExpiry } = JSON.parse(localStorage.app_100804_MiniQuotes)
    const { value: fullNews, expires_at: fullNewsExpiry } = JSON.parse(localStorage.app_100804_FullNews)

    const token = {
      quote,
      timeAndSales,
      profile,
      historical,
      miniFundamentals,
      miniQuotes,
      fullNews,
      expiry: moment.utc(
        _.min([
          quoteExpiry,
          profileExpiry,
          historicalExpiry,
          timeAndSalesExpiry,
          miniFundamentalsExpiry,
          miniQuotesExpiry,
          fullNewsExpiry
        ])
      ).toDate()
    }
    log.info('Fetched free real time token: %j', token)
    return token
  }

  /**
     * Analogous stream methods below
     */
  streamStocksFromSymbols () {
    return streamWrapper.asParallelTransformAsync((symbol: string) => this.getStockFromSymbol(symbol))
  }
}
