import { Promise } from 'bluebird'
import * as cheerio from 'cheerio'
import * as _ from 'lodash'
import Http from '../util/http'
import log from '../util/log'
import * as math from '../util/math'
import * as properties from '../util/properties'
import * as streamWrapper from '../util/streamWrapper'
import Fund from './Fund'
import { InvestmentIdProvider } from './FundFactory'

const http = new Http({
  maxParallelConnections: properties.get('fund.charlesstanleydirect.max.parallel.connections'),
  maxAttempts: properties.get('fund.charlesstanleydirect.max.attempts'),
  retryInterval: properties.get('fund.charlesstanleydirect.retry.interval'),
  timeout: properties.get('fund.charlesstanleydirect.timeout')
})

type FundList = { investmentId: string, isin: string }[]

export default class CharlesStanleyDirect implements InvestmentIdProvider {
  pageSize: number
  constructor () {
    this.pageSize = properties.get('fund.charlesstanleydirect.page.size')
  }

  async getFunds () {
    const numPages = await this.getNumPages()
    const pageRange = await this.getPageRange(numPages)
    const investmentIds = await this.getInvestmentIdsFromPages(pageRange)
    const funds = await this.getFundsFromInvestmentIds(investmentIds)
    return funds
  }

  async getFundList () {
    const numPages = await this.getNumPages()
    const pageRange = await this.getPageRange(numPages)
    const fundList = await this.getFundListFromPages(pageRange)
    return fundList
  }

  async getPageRange (lastPage: number) {
    return _.range(1, lastPage + 1)
  }

  async getNumPages () {
    const url = `https://www.charles-stanley-direct.co.uk/InvestmentSearch/Search?Category=Funds&Pagesize=${this.pageSize}`
    const { data } = await http.asyncGet(url)
    const $ = cheerio.load(data)
    const lastPage = parseInt($('#search-results-top > p > em:last-child').text())
    log.debug('Total number of pages: %d', lastPage)
    return lastPage
  }

  async getFundListFromPage (page: number): Promise<FundList> {
    const url = `https://www.charles-stanley-direct.co.uk/InvestmentSearch/Search?sortdirection=ASC&SearchType=KeywordSearch&Category=Funds&SortColumn=TER&SortDirection=DESC&Pagesize=${this.pageSize}&Page=${page}`
    const { data } = await http.asyncGet(url)
    const $ = cheerio.load(data)
    const fundList = $('#funds-table')
      .find('tbody td.action > div.action > a:first-child')
      .map((i, a) => {
        const groups = $(a)
          .attr('href')
          .match(/InvestmentId=(.*?)&Isin=(.*?)&/)
        return { investmentId: groups[1], isin: groups[2] }
      })
      .get()
    log.debug('Fund list from page %d: %j', page, fundList)
    return fundList
  }

  async getFundListFromPages (pages: number[]): Promise<FundList> {
    const fundLists = await Promise.map(pages, (page) => this.getFundListFromPage(page))
    return _.flatten(fundLists)
  }

  async getInvestmentIdsFromPage (page: number) {
    const fundList = await this.getFundListFromPage(page)
    return fundList.map(({ investmentId }) => investmentId)
  }

  async getInvestmentIdsFromPages (pages: number[]) {
    const fundLists = await Promise.map(pages, (page) => this.getInvestmentIdsFromPage(page))
    return _.flatten(fundLists)
  }

  /**
     * ONLY PARTIAL FUND IS RETURNED!! (with isin and bid ask spread as % of price)
     * @param investmentId
     */
  async getFundFromInvestmentId (investmentId: string) {
    const url = `https://www.charles-stanley-direct.co.uk/ViewFund?InvestmentId=${investmentId}`
    let data
    try {
      ({ data } = await http.asyncGet(url))
    } catch (err) {
      log.error('Failed to get investment id from Charles Stanley: %s', investmentId)
      return undefined // return undefined so that it will continue all the way to FundDAO and get rejected
    }
    const $ = cheerio.load(data)
    const isinRegex = /[A-Z0-9]{12}/
    let isin
    try {
      isin = $('.para').text().match(isinRegex)[0]
    } catch (err) {
      log.error('Invalid page for investment id on Charles Stanley: %s', investmentId)
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
      const dataCompositionHoldings = JSON.parse(data.match(dataCompositionHoldingsRegex)[1])
      holdings = dataCompositionHoldings.map((e: any) => {
        const name = e.tooltip.split('(')[0].trim()
        const symbol = null as string // charles stanley does not have symbol, need to fetch this from FT
        const weight = math.pcToFloat(e.amount)
        return new Fund.Holding(name, symbol, weight)
      })
    } catch (err) {
      log.error('Missing holdings for investment id on Charles Stanley: %s', investmentId)
      return undefined // return undefined so that it will continue all the way to FundDAO and get rejected
    }
    const partialFund = Fund.builder(isin)
      .bidAskSpread(bidAskSpread)
      .entryCharge(entryCharge)
      .amc(amc)
      .ocf(ocf)
      .holdings(holdings)
      .build()
    log.debug('Isin: %s found for investment id: %s - bid ask spread: %d, entry charge: %d, amc: %d, ocf: %d', isin, investmentId, bidAskSpread, entryCharge, amc, ocf)
    return partialFund
  }

  async getFundsFromInvestmentIds (investmentIds: string[]) {
    return Promise.map(investmentIds, (investmentId) => this.getFundFromInvestmentId(investmentId))
  }

  /**
   * Analogous stream methods below
   */
  streamFunds () {
    return this.streamNumPages()
      .pipe(this.streamPageRange())
      .pipe(this.streamInvestmentIdsFromPages())
      .pipe(this.streamFundsFromInvestmentIds())
  }

  streamNumPages () {
    return streamWrapper.asReadableAsync(() => this.getNumPages())
  }

  streamPageRange () {
    return streamWrapper.asTransformAsync((numPages: number) => this.getPageRange(numPages))
  }

  streamInvestmentIdsFromPages () {
    return streamWrapper.asTransformAsync((page: number) => this.getInvestmentIdsFromPage(page))
  }

  streamFundsFromInvestmentIds () {
    return streamWrapper.asParallelTransformAsync((investmentId: string) => this.getFundFromInvestmentId(investmentId))
  }

  /**
     * Miscellaneous methods
     */
  async healthCheck () {
    const url = 'https://www.charles-stanley-direct.co.uk'
    const { data } = await http.asyncGet(url)
    const isDown = data.toLowerCase().includes('unavailable')
    return !isDown
  }
}
