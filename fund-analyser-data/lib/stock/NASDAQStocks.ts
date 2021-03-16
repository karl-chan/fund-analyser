import { Promise } from 'bluebird'
import * as _ from 'lodash'
import moment, { Moment } from 'moment'
import Http from '../util/http'
import log from '../util/log'
import * as properties from '../util/properties'
import * as streamWrapper from '../util/streamWrapper'
import Stock from './Stock'
import { StockProvider } from './StockFactory'

const http = new Http({
  maxParallelConnections: properties.get('stock.nasdaq.max.parallel.connections'),
  maxAttempts: properties.get('stock.nasdaq.max.attempts'),
  retryInterval: properties.get('stock.nasdaq.retry.interval'),
  headers: {
    pragma: 'no-cache',
    'cache-control': 'no-cache',
    'upgrade-insecure-requests': '1',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'sec-fetch-site': 'none',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-user': '?1',
    'sec-fetch-dest': 'document',
    'accept-language': 'en-US,en;q=0.9'
  }
})

export default class NASDAQStocks implements StockProvider {
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
      .yld(summary.yld)
      .build()
  }

  async getStocksFromSymbols (isins: string[]) {
    return Promise.map(isins, isin => this.getStockFromSymbol(isin))
  }

  async getSummary (symbol: string) {
    try {
      const [{ data: res1 }, { data: res2 }] = await Promise.all([
        http.asyncGet(
          `https://api.nasdaq.com/api/quote/${symbol}/info?assetclass=stocks`,
          { responseType: 'json' }),
        http.asyncGet(
          `https://api.nasdaq.com/api/quote/${symbol}/dividends?assetclass=stocks`,
          { responseType: 'json' })
      ])
      const name = res1.data.companyName.replace(/(.+) Common Stock/, '$1')
      const marketCap = +res1.data.keyStats.MarketCap.value.replace(/,/g, '')
      const yld = res2.data.yield === 'N/A'
        ? 0
        : +res2.data.yield.replace(/(.+)%/, '$1') / 100

      return {
        name,
        marketCap,
        yld
      }
    } catch (err) {
      log.warn('Failed to retrieve NASDAQStocks summary for symbol: %s. Cause: %s', symbol, err.stack)
      return {}
    }
  }

  async getHistoricPrices (symbol: string) {
    try {
      const url = `https://api.nasdaq.com/api/quote/${symbol}/historical`
      const { data } = await http.asyncGet(url, {
        params: {
          assetclass: 'stocks',
          limit: 10000,
          fromdate: moment.utc().subtract(this.maxLookbackYears, 'years').format('YYYY-MM-DD'),
          todate: moment.utc().format('YYYY-MM-DD')
        },
        responseType: 'json'
      })
      const historicPrices: Stock.HistoricPrice[] =
        data.data.tradesTable.rows
          .reverse()
          .map((row: any) => {
            const date = moment.utc(row.date, 'MM/DD/YYYY').toDate()
            const close = +row.close.replace(/\$(.+)/, '$1')
            const volume = +row.volume.replace(/,/g, '')
            return new Stock.HistoricPrice(date, close, volume)
          })
      return historicPrices
    } catch (err) {
      log.warn('Failed to retrieve NASDAQStocks historic prices for symbol: %s. Cause: %s', symbol, err.stack)
      return []
    }
  }

  async getRealTimeDetails (symbol: string) {
    try {
      const [{ data: res1 }, { data: res2 }] = await Promise.all([
        http.asyncGet(
          `https://api.nasdaq.com/api/quote/${symbol}/info?assetclass=stocks`,
          { responseType: 'json' }),
        http.asyncGet(
          `https://api.nasdaq.com/api/quote/${symbol}/realtime-trades`,
          {
            params: {
              fromtime: '09:30',
              limit: 10000
            },
            responseType: 'json'
          })])

      const estPrice = +res1.data.primaryData.lastSalePrice.replace(/\$(.+)/, '$1')
      const estChange = +res1.data.primaryData.percentageChange.replace(/(.+)%/, '$1') / 100

      const tradeTimes: Moment[] = res2.data.rows.map((row: any) => moment.utc(row.nlsTime, 'HH:mm:ss'))
      const tradeTimeGaps = _.zip(tradeTimes.slice(0, -1), _.tail(tradeTimes)).map(([t1, t2]) => t1.diff(t2, 'seconds'))
      const longestTimeGap = _.max(tradeTimeGaps)

      const tradePrices: number[] = res2.data.rows.map((row: any) => +row.nlsPrice.replace(/\$ (.+)/, '$1'))
      const tradePriceMovements = _.zip(tradePrices.slice(0, -1), _.tail(tradePrices)).map(([p1, p2]) => {
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
      log.warn('Failed to retrieve NASDAQStocks bid-ask spread for symbol: %s. Cause: %s', symbol, err.stack)
      return undefined
    }
  }

  /**
   * Analogous stream methods below
   */
  streamStocksFromSymbols () {
    return streamWrapper.asParallelTransformAsync((symbol: string) => this.getStockFromSymbol(symbol))
  }
}
