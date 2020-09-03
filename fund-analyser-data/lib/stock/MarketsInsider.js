const cheerio = require('cheerio')
const Promise = require('bluebird')
const _ = require('lodash')
const moment = require('moment')

const Stock = require('./Stock')
const Http = require('../util/http')
const log = require('../util/log')
const properties = require('../util/properties')
const streamWrapper = require('../util/streamWrapper')

const http = new Http({
    maxParallelConnections: properties.get('stock.marketsinsider.max.parallel.connections'),
    maxAttempts: properties.get('stock.marketsinsider.max.attempts'),
    retryInterval: properties.get('stock.marketsinsider.retry.interval')
})

class MarketsInsider {
    constructor () {
        this.indexName = 's&p_500'
        this.maxLookbackYears = properties.get('stock.max.lookback.years')
    }

    async getSymbols () {
        const numPages = await this.getNumPages()
        const pageRange = await this.getPageRange(numPages)
        const symbols = this.getSymbolsFromPages(pageRange)
        return symbols
    }

    async getNumPages () {
        const url = `https://markets.businessinsider.com/index/components/${this.indexName}`
        const { body } = await http.asyncGet(url)

        const $ = cheerio.load(body)
        const lastPage = parseInt($('.finando_paging > :last-child').text())
        log.debug('Total number of pages: %d', lastPage)
        return lastPage
    }

    async getPageRange (lastPage) {
        return _.range(1, lastPage + 1)
    }

    async getSymbolsFromPage (page) {
        const url = `https://markets.businessinsider.com/index/components/${this.indexName}?p=${page}`
        const { body } = await http.asyncGet(url)

        const $ = cheerio.load(body)
        const symbols = $('.table').find('tbody td:first-child')
            .map((i, td) =>
                $(td).find('a').attr('href').replace(/^\/stocks\/(.*)-stock$/, '$1')).get()
        log.debug('Symbols in page %d: %j', page, symbols)
        return symbols
    }

    async getSymbolsFromPages (pages) {
        const symbols = await Promise.map(pages, this.getSymbolsFromPage.bind(this))
        return _.flatten(symbols)
    }

    async getStockFromSymbol (symbol) {
        const [summary, historicPrices] = await Promise.all([this.getSummary(symbol), this.getHistoricPrices(symbol)])

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
        const url = `https://markets.businessinsider.com/stocks/${symbol}-stock`
        const { body } = await http.asyncGet(url)

        const $ = cheerio.load(body)

        const name = $('.price-section__label').text()
        const estPrice = +$('.price-section__current-value').text()
        const estChange = +$('.price-section__relative-value').text().replace(/^\((.+)%\)$/, '$1') / 100

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
        const url = `https://markets.businessinsider.com/stocks/${symbol}-stock`
        const { body } = await http.asyncGet(url)

        const detailChartViewmodelRegex = /var detailChartViewmodel = (.*);/
        const detailChartViewmodel = JSON.parse(body.match(detailChartViewmodelRegex)[1])

        const tkData = detailChartViewmodel.TKData
        const fromDate = moment.utc().subtract(this.maxLookbackYears, 'years').format('YYYYMMDD')
        const toDate = moment.utc().format('YYYYMMDD')

        const url2 = `https://markets.businessinsider.com/Ajax/Chart_GetChartData?instrumentType=Share&tkData=${tkData}&from=${fromDate}&to=${toDate}`
        const { body: body2 } = await http.asyncGet(url2)

        const series = JSON.parse(body2)
        const historicPrices = series
            .map(row => new Stock.HistoricPrice(
                moment.utc(row.Date, 'YYYY-MM-DD HH:mm').toDate(),
                row.Open, row.High, row.Low, row.Close, row.Volume
            ))
            .filter(hp => hp.close !== 0) // skip bad entries
        return historicPrices
    }

    /**
     * Analogous stream methods below
     */
    streamSymbols () {
        return this.streamNumPages()
            .pipe(this.streamPageRange())
            .pipe(this.streamSymbolsFromPages())
            .pipe(this.streamStocksFromSymbols())
    }

    streamNumPages () {
        return streamWrapper.asReadableAsync(this.getNumPages)
    }

    streamPageRange () {
        return streamWrapper.asTransformAsync(this.getPageRange)
    }

    streamSymbolsFromPages () {
        return streamWrapper.asTransformAsync(this.getSymbolsFromPage)
    }

    streamStocksFromSymbols () {
        return streamWrapper.asParallelTransformAsync(this.getStockFromSymbol.bind(this))
    }
}

module.exports = MarketsInsider
