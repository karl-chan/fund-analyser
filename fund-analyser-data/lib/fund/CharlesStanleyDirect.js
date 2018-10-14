const Fund = require('./Fund')
const Http = require('../util/http')
const math = require('../util/math')
const properties = require('../util/properties')
const log = require('../util/log')
const streamWrapper = require('../util/streamWrapper')
const _ = require('lodash')
const cheerio = require('cheerio')
const Promise = require('bluebird')

const http = new Http({
    maxParallelConnections: properties.get('fund.charlesstanleydirect.max.parallel.connections'),
    maxAttempts: properties.get('fund.charlesstanleydirect.max.attempts'),
    retryInterval: properties.get('fund.charlesstanleydirect.retry.interval')
})

class CharlesStanleyDirect {
    constructor () {
        this.pageSize = properties.get('fund.charlesstanleydirect.page.size')
    }

    async getFunds () {
        const numPages = await this.getNumPages()
        const pageRange = await this.getPageRange(numPages)
        const sedols = await this.getSedolsFromPages(pageRange)
        const funds = await this.getFundsFromSedols(sedols)
        return funds
    }

    async getSedols () {
        const numPages = await this.getNumPages()
        const pageRange = await this.getPageRange(numPages)
        const sedols = await this.getSedolsFromPages(pageRange)
        return sedols
    }

    async getPageRange (lastPage) {
        return _.range(1, lastPage + 1)
    }

    async getNumPages () {
        const url = `https://www.charles-stanley-direct.co.uk/InvestmentSearch/Search?Category=Funds&Pagesize=${this.pageSize}`
        const { body } = await http.asyncGet(url)

        const $ = cheerio.load(body)
        const lastPage = parseInt($('#search-results-top > p > em:last-child').text())
        log.debug('Total number of pages: %d', lastPage)
        return lastPage
    }

    async getSedolsFromPage (page) {
        const url = `https://www.charles-stanley-direct.co.uk/InvestmentSearch/Search?sortdirection=ASC&SearchType=KeywordSearch&Category=Funds&SortColumn=TER&SortDirection=DESC&Pagesize=${this.pageSize}&Page=${page}`
        const { body } = await http.asyncGet(url)

        const $ = cheerio.load(body)
        const sedols = $('#funds-table').find('tbody td:nth-child(3)').map((i, td) => $(td).text().trim()).get()
        log.debug('Sedols in page %d: %j', page, sedols)
        return sedols
    }

    async getSedolsFromPages (pages) {
        const sedols = await Promise.map(pages, this.getSedolsFromPage.bind(this))
        return _.flatten(sedols)
    }

    /**
     * ONLY PARTIAL FUND IS RETURNED!! (with isin and bid ask spread as % of price)
     * @param sedol
     */
    async getFundFromSedol (sedol) {
        const url = `https://www.charles-stanley-direct.co.uk/ViewFund?Sedol=${sedol}`
        const { body } = await http.asyncGet(url)

        const $ = cheerio.load(body)
        const isinRegex = /[A-Z0-9]{12}/
        let isin
        try {
            isin = $('.para').text().match(isinRegex)[0]
        } catch (err) {
            log.error('Invalid page for sedol on Charles Stanley: %s', sedol)
            return undefined // return undefined so that it will continue all the way to FundDAO and get rejected
        }

        // bid ask
        const floatRegex = /[0-9,.\s]+/
        const bidPrice = parseFloat($('.fund-summary ul li:nth-child(1)').text().match(floatRegex)[0].replace(/[,\s]/g, ''))
        const askPrice = parseFloat($('.fund-summary ul li:nth-child(2)').text().match(floatRegex)[0].replace(/[,\s]/g, ''))
        const midPrice = (bidPrice + askPrice) / 2
        const bidAskSpread = (bidPrice - askPrice) / midPrice

        // initial charge
        const entryCharge = math.pcToFloat($('#main div.panel--light-grey  div:nth-child(6) tr:nth-child(2) > td:nth-child(2)').text())

        const partialFund = Fund.Builder(isin)
            .sedol(sedol)
            .bidAskSpread(bidAskSpread)
            .entryCharge(entryCharge)
            .build()
        log.debug('Isin: %s found for sedol: %s - bid ask spread: %d, entry charge: %d', isin, sedol, bidAskSpread, entryCharge)
        return partialFund
    }

    async getFundsFromSedols (sedols) {
        return Promise.map(sedols, this.getFundFromSedol.bind(this))
    }

    /**
     * Analogous stream methods below
     */
    streamFunds () {
        return this.streamNumPages()
            .pipe(this.streamPageRange())
            .pipe(this.streamSedolsFromPages())
            .pipe(this.streamFundsFromSedols())
    }
    streamNumPages () {
        return streamWrapper.asReadableAsync(this.getNumPages)
    }
    streamPageRange () {
        return streamWrapper.asTransformAsync(this.getPageRange)
    }
    streamSedolsFromPages () {
        return streamWrapper.asTransformAsync(this.getSedolsFromPage)
    }
    streamFundsFromSedols () {
        return streamWrapper.asParallelTransformAsync(this.getFundFromSedol)
    }

    /**
     * Miscellaneous s
     */
    async healthCheck () {
        const url = `https://www.charles-stanley-direct.co.uk`
        const { body } = await http.asyncGet(url)
        const isDown = body.toLowerCase().includes('unavailable')
        return !isDown
    }
}

module.exports = CharlesStanleyDirect
