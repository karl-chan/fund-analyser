
import { Promise } from 'bluebird'
import * as _ from 'lodash'
import moment from 'moment'
import Http from '../util/http'
import log from '../util/log'
import * as properties from '../util/properties'
import * as streamWrapper from '../util/streamWrapper'
import Stock from './Stock'
import { StockProvider } from './StockFactory'

const http = new Http({
  maxAttempts: properties.get('stock.nasdaq.max.attempts'),
  retryInterval: properties.get('stock.nasdaq.retry.interval'),
  headers: {
    'User-Agent': 'PostmanRuntime/7.26.8'
  }
})

export default class NASDAQStocks implements StockProvider {
  maxLookbackYears: number

  constructor () {
    this.maxLookbackYears = properties.get('stock.max.lookback.years')
  }

  async getStockFromSymbol (symbol: string) {
    const [summary, historicPrices, bidAskSpread] = await Promise.all([
      this.getSummary(symbol),
      this.getHistoricPrices(symbol),
      this.getBidAskSpread(symbol)
    ])
    return Stock.builder(symbol)
      .name(summary.name)
      .historicPrices(historicPrices)
      .asof(_.isEmpty(historicPrices) ? undefined : _.last(historicPrices).date)
      .realTimeDetails(summary.realTimeDetails)
      .bidAskSpread(bidAskSpread)
      .marketCap(summary.marketCap)
      .build()
  }

  async getStocksFromSymbols (isins: string[]) {
    return Promise.map(isins, isin => this.getStockFromSymbol(isin))
  }

  async getSummary (symbol: string) {
    try {
      const url = `https://api.nasdaq.com/api/quote/${symbol}/info?assetclass=stocks`
      const { data } = await http.asyncGet(url,
        {
          responseType: 'json'
        })
      const name = data.data.companyName.replace(/(.+) Common Stock/, '$1')
      const estPrice = +data.data.primaryData.lastSalePrice.replace(/\$(.+)/, '$1')
      const estChange = +data.data.primaryData.percentageChange.replace(/(.+)%/, '$1') / 100
      const marketCap = +data.data.keyStats.MarketCap.value.replace(/,/g, '')

      return {
        name,
        realTimeDetails: {
          estPrice,
          estChange,
          lastUpdated: new Date()
        },
        marketCap
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
          limit: this.maxLookbackYears * 365,
          fromdate: moment.utc().subtract(5, 'years').format('YYYY-MM-DD'),
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

  async getBidAskSpread (symbol: string) {
    try {
      const url = `https://api.nasdaq.com/api/quote/${symbol}/realtime-trades`
      const { data } = await http.asyncGet(url, {
        params: {
          fromtime: '09:30',
          limit: 10000
        },
        responseType: 'json'
      })
      const tradedPrices: number[] = data.data.rows.map((row: any) => +row.nlsPrice.replace(/\$ (.+)/, '$1'))
      const movements = _.zip(tradedPrices, _.tail(tradedPrices)).map(([p1, p2]) => {
        const absDiff = Math.abs(p1 - p2)
        const midPrice = (p1 + p2) / 2
        const pctMovement = absDiff / midPrice
        return pctMovement
      })
      const bidAskSpread = _.max(movements)
      return bidAskSpread
    } catch (err) {
      log.warn('Failed to retrieve NASDAQStocks bid-ask spread for symbol: %s. Cause: %s', symbol, err.stack)
      return null
    }
  }

  /**
   * Analogous stream methods below
   */
  streamStocksFromSymbols () {
    return streamWrapper.asParallelTransformAsync((symbol: string) => this.getStockFromSymbol(symbol))
  }
}
