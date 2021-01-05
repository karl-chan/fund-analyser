import { Promise } from 'bluebird'
import * as cheerio from 'cheerio'
import * as _ from 'lodash'
import Http from '../util/http'
import log from '../util/log'
import * as math from '../util/math'
import * as properties from '../util/properties'
import * as streamWrapper from '../util/streamWrapper'
import Fund from './Fund'
import { IsinProvider } from './FundFactory'

const http = new Http({
  maxParallelConnections: properties.get('fund.charlesstanleydirect.max.parallel.connections'),
  maxAttempts: properties.get('fund.charlesstanleydirect.max.attempts'),
  retryInterval: properties.get('fund.charlesstanleydirect.retry.interval'),
  timeout: properties.get('fund.charlesstanleydirect.timeout')
})

export default class CharlesStanleyDirect implements IsinProvider {
    pageSize: any;
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

    private async getPageRange (lastPage: any) {
      return _.range(1, lastPage + 1)
    }

    private async getNumPages () {
      const url = `https://www.charles-stanley-direct.co.uk/InvestmentSearch/Search?Category=Funds&Pagesize=${this.pageSize}`
      const { body } = await http.asyncGet(url)
      const $ = cheerio.load(body)
      const lastPage = parseInt($('#search-results-top > p > em:last-child').text())
      log.debug('Total number of pages: %d', lastPage)
      return lastPage
    }

    private async getSedolsFromPage (page: any) {
      const url = `https://www.charles-stanley-direct.co.uk/InvestmentSearch/Search?sortdirection=ASC&SearchType=KeywordSearch&Category=Funds&SortColumn=TER&SortDirection=DESC&Pagesize=${this.pageSize}&Page=${page}`
      const { body } = await http.asyncGet(url)
      const $ = cheerio.load(body)
      const sedols = $('#funds-table').find('tbody td:nth-child(3)').map((i: any, td: any) => $(td).text().trim()).get()
      log.debug('Sedols in page %d: %j', page, sedols)
      return sedols
    }

    private async getSedolsFromPages (pages: any) {
      const sedols = await (Promise as any).map(pages, this.getSedolsFromPage.bind(this))
      return _.flatten(sedols)
    }

    /**
     * ONLY PARTIAL FUND IS RETURNED!! (with isin and bid ask spread as % of price)
     * @param sedol
     */
    async getFundFromSedol (sedol: any) {
      const url = `https://www.charles-stanley-direct.co.uk/ViewFund?Sedol=${sedol}`
      let body
      try {
        ({ body } = await http.asyncGet(url))
      } catch (err) {
        log.error('Failed to get sedol from Charles Stanley: %s', sedol)
        return undefined // return undefined so that it will continue all the way to FundDAO and get rejected
      }
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
      const floatRegex = /[0-9,.]+/
      const bidPrice = parseFloat($('.fund-summary ul li:nth-child(1)').text().match(floatRegex)[0].replace(/[,]/g, ''))
      const askPrice = parseFloat($('.fund-summary ul li:nth-child(2)').text().match(floatRegex)[0].replace(/[,]/g, ''))
      const midPrice = (bidPrice + askPrice) / 2
      const bidAskSpread = (bidPrice - askPrice) / midPrice
      // initial charge / amc / ocf
      const chargesTable = $('p:contains(\'Charges\')').eq(0).next('table')
      const entryCharge = math.pcToFloat(chargesTable.find('td:contains(\'Initial Charge\') + td').text().trim())
      const amc = math.pcToFloat(chargesTable.find('td:contains(\'AMC\') + td').text().trim())
      const ocf = math.pcToFloat(chargesTable.find('td:contains(\'Total Ongoing Charges\') + td').text().trim())
      // holdings
      let holdings = []
      try {
        const dataCompositionHoldingsRegex = /var dataCompositionHoldings = (.*)/
        const dataCompositionHoldings = JSON.parse(body.match(dataCompositionHoldingsRegex)[1])
        holdings = dataCompositionHoldings.map((e: any) => {
          const name = e.tooltip.split('(')[0].trim()
          const symbol = null as string // charles stanley does not have symbol, need to fetch this from FT
          const weight = math.pcToFloat(e.amount)
          return new Fund.Holding(name, symbol, weight)
        })
      } catch (err) {
        log.error('Missing holdings for sedol on Charles Stanley: %s', sedol)
        return undefined // return undefined so that it will continue all the way to FundDAO and get rejected
      }
      const partialFund = Fund.builder(isin)
        .sedol(sedol)
        .bidAskSpread(bidAskSpread)
        .entryCharge(entryCharge)
        .amc(amc)
        .ocf(ocf)
        .holdings(holdings)
        .build()
      log.debug('Isin: %s found for sedol: %s - bid ask spread: %d, entry charge: %d, amc: %d, ocf: %d', isin, sedol, bidAskSpread, entryCharge, amc, ocf)
      return partialFund
    }

    async getFundsFromSedols (sedols: any) {
      return (Promise as any).map(sedols, this.getFundFromSedol.bind(this))
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

    private streamNumPages () {
      return streamWrapper.asReadableAsync(this.getNumPages)
    }

    private streamPageRange () {
      return streamWrapper.asTransformAsync(this.getPageRange)
    }

    private streamSedolsFromPages () {
      return streamWrapper.asTransformAsync(this.getSedolsFromPage)
    }

    streamFundsFromSedols () {
      return streamWrapper.asParallelTransformAsync(this.getFundFromSedol)
    }

    /**
     * Miscellaneous methods
     */
    async healthCheck () {
      const url = 'https://www.charles-stanley-direct.co.uk'
      const { body } = await http.asyncGet(url)
      const isDown = body.toLowerCase().includes('unavailable')
      return !isDown
    }
}
