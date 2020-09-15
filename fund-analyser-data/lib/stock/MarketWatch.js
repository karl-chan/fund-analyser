const cheerio = require('cheerio')
const Promise = require('bluebird')
const _ = require('lodash')
const moment = require('moment')

const Stock = require('./Stock')
const Http = require('../util/http')
const properties = require('../util/properties')
const streamWrapper = require('../util/streamWrapper')

const http = new Http()

class MarketWatch {
    constructor () {
        this.maxLookbackYears = properties.get('stock.max.lookback.years')
    }

    async getStockFromSymbol (symbol) {
        const marketWatchSymbol = symbol.replace('-', '.')
        const [summary, historicPrices] = await Promise.all([
            this.getSummary(marketWatchSymbol),
            this.getHistoricPrices(marketWatchSymbol)
        ])

        return Stock.Builder(symbol)
            .name(summary.name)
            .historicPrices(historicPrices)
            .asof(_.isEmpty(historicPrices) ? undefined : _.last(historicPrices).date)
            .realTimeDetails(summary.realTimeDetails)
            .build()
    }

    async getStocksFromSymbols (isins) {
        return Promise.map(isins, this.getStockFromSymbol.bind(this))
    }

    async getSummary (symbol) {
        const url = `https://www.marketwatch.com/investing/stock/${symbol}/charts`
        const { body } = await http.asyncGet(url)

        const $ = cheerio.load(body)

        const name = $('.company__name').text()
        const estPrice = +$('.intraday__price > bg-quote').text()
        const estChange = $('.change--percent--q').text().replace(/(.+)%$/, '$1') / 100

        return {
            name,
            realTimeDetails: {
                estPrice,
                estChange,
                lastUpdated: new Date()
            }
        }
    }

    async getHistoricPrices (symbol) {
        const url = `https://www.marketwatch.com/investing/stock/${symbol}/charts`
        const { body } = await http.asyncGet(url)

        const $ = cheerio.load(body)
        const key = $('meta[name="chartingSymbol"]').attr('content')

        const url2 = 'https://api-secure.wsj.net/api/michelangelo/timeseries/history'

        const { body: body2 } = await http.asyncGet(url2, {
            qs: {
                json: JSON.stringify({
                    Step: 'P1D',
                    TimeFrame: `P${this.maxLookbackYears}Y`,
                    EntitlementToken: 'cecc4267a0194af89ca343805a3e57af',
                    Series: [
                        {
                            Key: key,
                            Dialect: 'Charting',
                            Kind: 'Ticker',
                            SeriesId: 'ohlc',
                            DataTypes: ['Open', 'High', 'Low', 'Last'],
                            Indicators: [{ Parameters: [], Kind: 'Volume', SeriesId: 'volume' }]
                        }]
                }),
                ckey: 'cecc4267a0'
            },
            headers: {
                'Dylan2010.EntitlementToken': 'cecc4267a0194af89ca343805a3e57af'
            }
        })

        const res = JSON.parse(body2)
        const dates = res.TimeInfo.Ticks
        const ohlcs = res.Series.find(s => s.SeriesId === 'ohlc').DataPoints
        const volumes = res.Series.find(s => s.SeriesId === 'volume').DataPoints
        const historicPrices = _.zip(dates, ohlcs, volumes).map(([date, ohlc, [volume]]) => {
            return new Stock.HistoricPrice(
                moment.utc(date).toDate(),
                ...ohlc,
                volume
            )
        })
        return historicPrices
    }

    /**
     * Analogous stream methods below
     */
    streamSymbolsFromPages () {
        return streamWrapper.asTransformAsync(this.getSymbolsFromPage)
    }

    streamStocksFromSymbols () {
        return streamWrapper.asParallelTransformAsync(this.getStockFromSymbol.bind(this))
    }
}

module.exports = MarketWatch
