import { Promise } from 'bluebird'
import * as cheerio from 'cheerio'
import * as _ from 'lodash'
import moment from 'moment'
import Http from '../util/http'
import log from '../util/log'
import * as properties from '../util/properties'
import * as streamWrapper from '../util/streamWrapper'
import Stock from './Stock'
import { StockProvider } from './StockFactory'

const http = new Http()

export default class MarketWatch implements StockProvider {
    maxLookbackYears: string

    constructor () {
      this.maxLookbackYears = properties.get('stock.max.lookback.years')
    }

    private async getStockFromSymbol (symbol: any) {
      const [summary, historicPrices] = await Promise.all([
        this.getSummary(symbol),
        this.getHistoricPrices(symbol)
      ])
      return Stock.builder(symbol)
        .name(summary.name)
        .historicPrices(historicPrices)
        .asof(_.isEmpty(historicPrices) ? undefined : _.last(historicPrices).date)
        .realTimeDetails(summary.realTimeDetails)
        .build()
    }

    async getStocksFromSymbols (isins: any) {
      return (Promise as any).map(isins, this.getStockFromSymbol.bind(this))
    }

    async getSummary (symbol: any) {
      try {
        const url = `https://www.marketwatch.com/investing/stock/${symbol}/charts`
        const { body } = await http.asyncGet(url)
        const $ = cheerio.load(body)
        const name = $('.company__name').text()
        const estPrice = +$('.intraday__price > bg-quote').text()
        const estChange = parseFloat($('.change--percent--q').text().replace(/(.+)%$/, '$1')) / 100
        return {
          name,
          realTimeDetails: {
            estPrice,
            estChange,
            lastUpdated: new Date()
          }
        }
      } catch (err) {
        log.warn('Failed to retrieve MarketWatch summary for symbol: %s. Cause: %s', symbol, err.stack)
        return {}
      }
    }

    async getHistoricPrices (symbol: any) {
      try {
        const url = `https://www.marketwatch.com/investing/stock/${symbol}/charts`
        const { body } = await http.asyncGet(url)
        const $ = cheerio.load(body)
        const market = $('.company__market').eq(1).text()
        const ticker = $('.company__ticker').eq(1).text()
        if (!market) {
          throw new Error(`Failed to retrieve market for ${symbol}`)
        }
        if (!ticker) {
          throw new Error(`Failed to retrieve ticker for ${symbol}`)
        }
        const url2 = 'https://api.wsj.net/api/dylan/quotes/v2/comp/quote'
        const { body: body2 } = await http.asyncGet(url2, {
          qs: {
            id: symbol,
            maxInstrumentMatches: 1,
            ckey: 'cecc4267a0',
            EntitlementToken: 'cecc4267a0194af89ca343805a3e57af',
            accept: 'application%2Fjson'
          }
        })
        const res2 = JSON.parse(body2)
        const exchange = res2.GetInstrumentResponse.InstrumentResponses[0].Matches[0].Instrument.Exchange
        const countryCode = exchange.CountryCode
        const isoCode = exchange.IsoCode
        if (!countryCode) {
          throw new Error(`Failed to retrieve countryCode for ${symbol}`)
        }
        if (!isoCode) {
          throw new Error(`Failed to retrieve isoCode for ${symbol}`)
        }
        const key = `STOCK/${countryCode}/${isoCode}/${ticker}`
        const url3 = 'https://api-secure.wsj.net/api/michelangelo/timeseries/history'
        const { body: body3 } = await http.asyncGet(url3, {
          qs: {
            json: JSON.stringify({
              Step: 'P1D',
              TimeFrame: `P${this.maxLookbackYears}Y`,
              EntitlementToken: 'cecc4267a0194af89ca343805a3e57af',
              IncludeMockTick: true,
              Series: [
                {
                  Key: key,
                  Dialect: 'Charting',
                  Kind: 'Ticker',
                  SeriesId: 'ohlc',
                  DataTypes: ['Open', 'High', 'Low', 'Last'],
                  Indicators: [{ Parameters: [], Kind: 'Volume', SeriesId: 'volume' }]
                }
              ]
            }),
            ckey: 'cecc4267a0'
          },
          headers: {
            'Dylan2010.EntitlementToken': 'cecc4267a0194af89ca343805a3e57af'
          }
        })
        const res3 = JSON.parse(body3)
        const dates = res3.TimeInfo.Ticks
        const ohlcs = res3.Series.find((s: any) => s.SeriesId === 'ohlc').DataPoints
        const volumes = res3.Series.find((s: any) => s.SeriesId === 'volume').DataPoints
        // @ts-expect-error ts-migrate(7031) FIXME: Binding element 'date' implicitly has an 'any' typ... Remove this comment to see the full error message
        const historicPrices = _.zip(dates, ohlcs, volumes).map(([date, [o, h, l, c], [volume]]) => {
          return new Stock.HistoricPrice(moment.utc(date).toDate(), c, volume)
        })
        return historicPrices
      } catch (err) {
        log.warn('Failed to retrieve MarketWatch historic prices for symbol: %s. Cause: %s', symbol, err.stack)
        return []
      }
    }

    /**
     * Analogous stream methods below
     */
    streamStocksFromSymbols () {
      return streamWrapper.asParallelTransformAsync(this.getStockFromSymbol.bind(this))
    }
}
