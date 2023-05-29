import { Promise } from 'bluebird'
import * as cheerio from 'cheerio'
import * as _ from 'lodash'
import moment from 'moment'
import Currency from '../currency/Currency'
import * as fundUtils from '../util/fundUtils'
import Http from '../util/http'
import * as lang from '../util/lang'
import log from '../util/log'
import * as math from '../util/math'
import * as properties from '../util/properties'
import * as streamWrapper from '../util/streamWrapper'
import Fund from './Fund'
import { FundProvider } from './FundFactory'

const http = new Http({
  maxParallelConnections: properties.get('fund.financialtimes.max.parallel.connections'),
  maxAttempts: properties.get('fund.financialtimes.max.attempts'),
  retryInterval: properties.get('fund.financialtimes.retry.interval')
})
export default class FinancialTimes implements FundProvider {
  fundTypeMap: {[fundType: string]: string}
  lookback: any
  shareClassMap: {[shareClass: string]: string}
  constructor () {
    this.fundTypeMap = {
      'Open Ended Investment Company': Fund.types.OEIC,
      SICAV: Fund.types.OEIC,
      FCP: Fund.types.OEIC,
      'Unit Trust': Fund.types.UNIT
    }
    this.shareClassMap = {
      Income: Fund.shareClasses.INC,
      Accumulation: Fund.shareClasses.ACC
    }
    this.lookback = properties.get('fund.financialtimes.lookback.days')
  }

  async getFundsFromIsins (csdFunds: Fund[]): Promise<Fund[]> {
    return Promise.map(csdFunds, csdFund => this.getFundFromIsin(csdFund))
  }

  async getFundFromIsin (csdFund: Fund): Promise<Fund> {
    if (!csdFund) {
      // @ts-ignore
      return new Fund()
    }
    /* Overload to accept partial fund case from Charles Stanley */
    const isin = csdFund?.isin
    log.silly('Get fund from isin: %s', isin)
    const [summary, performance, historicPrices, holdings] = await Promise.all([
      this.getSummary(isin),
      this.getPerformance(isin),
      this.getHistoricPrices(isin),
      this.getHoldings(isin, csdFund)
    ])
    const ftFund = Fund.builder(isin)
      .name(summary.name)
      .type(summary.type)
      .shareClass(summary.shareClass)
      .frequency(summary.frequency)
      .exitCharge(summary.exitCharge)
      .holdings(holdings)
      .historicPrices(historicPrices)
      .returns(performance)
      .asof(_.isEmpty(historicPrices) ? undefined : _.last(historicPrices).date)
      .build()

    // csd fund takes precedence where conflicts (bidAskSpread / entryCharge / amc / ocf ...)
    // @ts-ignore
    const fund = lang.assignIfDefined(new Fund(), csdFund, ftFund)
    if (!fund.isValid()) {
      log.warn('No data found for isin: %s', csdFund.isin)
    } else {
      log.debug('Got fund from isin %s', csdFund.isin)
      log.silly('Isin: %s. Fund: %j', csdFund, fund)
    }
    // try enrich with real time details
    try {
      const realTimeDetails = await this.getRealTimeDetails(fund)
      fund.realTimeDetails = realTimeDetails
    } catch (err) {
      log.error('Failed to get real time details for isin: %s. Cause: %s', csdFund, err.stack)
    }
    return fund
  }

  async getSummary (isin: string) {
    const url = `https://markets.ft.com/data/funds/tearsheet/summary?s=${isin}`
    const { data } = await http.asyncGet(url)
    const $ = cheerio.load(data)
    const name = $('.mod-tearsheet-overview__header__name--large').text()
    const leftTable = $('table.mod-ui-table.mod-ui-table--two-column.mod-profile-and-investment-app__table--profile')
    const type = leftTable.find('th:contains(\'Fund type\') + td').text()
    const shareClass = leftTable.find('th:contains(\'Income treatment\') + td').text()
    const rightTable = $('table.mod-ui-table.mod-ui-table--two-column.mod-profile-and-investment-app__table--invest')
    const frequency = rightTable.find('th:contains(\'Pricing frequency\') + td').text()
    const ocf = rightTable.find('th:contains(\'Net expense ratio\') + td').text()
    const amc = rightTable.find('th:contains(\'Max annual charge\') + td').text()
    const entryCharge = rightTable.find('th:contains(\'Initial charge\') + td').text()
    const exitCharge = rightTable.find('th:contains(\'Exit charge\') + td').text()
    const summary = {
      name: name,
      type: this.fundTypeMap[type],
      shareClass: this.getShareClass(shareClass, name),
      frequency: frequency,
      ocf: math.pcToFloat(ocf),
      amc: math.pcToFloat(amc),
      entryCharge: math.pcToFloat(entryCharge),
      exitCharge: math.pcToFloat(exitCharge)
    }
    return summary
  }

  async getPerformance (isin: string): Promise<{ [period: string]: number }> {
    const url = `https://markets.ft.com/data/funds/tearsheet/performance?s=${isin}`
    const { data } = await http.asyncGet(url)
    const $ = cheerio.load(data)
    const returns = $(`body > div.o-grid-container.mod-container > div:nth-child(3) 
                > section > div:nth-child(1) > div > div.mod-module__content 
                > div.mod-ui-table--freeze-pane__container.mod-ui-table--colored 
                > div.mod-ui-table--freeze-pane__scroll-container > table > tbody 
                > tr:nth-child(1)`)
    const fiveYearReturn = returns.find('td:nth-child(2)').text()
    const threeYearReturn = returns.find('td:nth-child(3)').text()
    const oneYearReturn = returns.find('td:nth-child(4)').text()
    const sixMonthReturn = returns.find('td:nth-child(5)').text()
    const threeMonthReturn = returns.find('td:nth-child(6)').text()
    const oneMonthReturn = returns.find('td:nth-child(7)').text()
    const performance = {
      '5Y': math.pcToFloat(fiveYearReturn),
      '3Y': math.pcToFloat(threeYearReturn),
      '1Y': math.pcToFloat(oneYearReturn),
      '6M': math.pcToFloat(sixMonthReturn),
      '3M': math.pcToFloat(threeMonthReturn),
      '1M': math.pcToFloat(oneMonthReturn)
    }
    return performance
  }

  async getHistoricPrices (isin: string): Promise<Fund.HistoricPrice[]> {
    const url = `https://markets.ft.com/data/funds/tearsheet/charts?s=${isin}`
    const { data } = await http.asyncGet(url)
    const $ = cheerio.load(data)
    // In case of failure, simply return an empty array and continue
    let symbol
    try {
      symbol = JSON.parse($(`body > div.o-grid-container.mod-container > div.ichart-container 
                > div:nth-child(1) > section:nth-child(1) > div > div 
                > div.mod-ui-overlay.clearfix.mod-overview-quote-app-overlay > div > div 
                > section.mod-tearsheet-add-to-watchlist`).attr('data-mod-config')).xid
    } catch (err) {
      log.warn('Failed to retrieve symbol for historic prices: %s', isin)
      return []
    }
    const url2 = 'https://markets.ft.com/data/chartapi/series'
    const { data: series } = await http.asyncPost(url2, {
      headers: {
        'content-type': 'application/json'
      },
      data: {
        days: this.lookback,
        dataPeriod: 'Day',
        returnDateType: 'ISO8601',
        elements: [{ Type: 'price', Symbol: symbol }]
      },
      responseType: 'json'
    })
    // In case of failure, simply return an empty array and continue
    try {
      const dates : number[] = series.Dates
      const prices : number[] = series.Elements[0].ComponentSeries.find((s: any) => s.Type === 'Close').Values
      const historicPrices = _.zipWith(dates, prices, (dateString, price) => {
        const date = moment.utc(dateString).toDate()
        return new Fund.HistoricPrice(date, price)
      })
      return fundUtils.dropWhileGaps(historicPrices)
    } catch (err) {
      log.warn('Failed to retrieve chartapi historic prices for isin: %s', isin)
      return []
    }
  }

  async getHistoricExchangeRates (base: string, quote: string):Promise<Currency.HistoricRate[]> {
    const entries = await this.getHistoricPrices(`${base}${quote}`)
    return entries.map(entry => new Currency.HistoricRate(entry.date, entry.price))
  }

  async getHoldings (isin: string, fallbackFund?: Fund): Promise<Fund.Holding[]> {
    const url = `https://markets.ft.com/data/funds/tearsheet/holdings?s=${isin}`
    const { data } = await http.asyncGet(url)
    const $ = cheerio.load(data)
    const table = $(`body > div.o-grid-container.mod-container > div:nth-child(3) > section 
                > div:nth-child(3) > div > div > table`)
    const tbody = $('body').html('<tbody></tbody>').append(table.children().not('thead, tfoot'))
    let holdings = tbody.find('tr').map((i, tr) => {
      const company = $(tr).find('td:nth-child(1)')
      const name = company.has('a').length ? company.find('a').text() : company.text()
      const symbol = company.find('span').text()
      const weight = math.pcToFloat($(tr).find('td:nth-child(3)').text())
      return new Fund.Holding(name, symbol, weight)
    }).get()
    // in case FT fails, read from fallback fund
    if (_.isEmpty(holdings) && fallbackFund && !_.isEmpty(fallbackFund.holdings)) {
      holdings = fallbackFund.holdings
    }
    // enrich holdings with symbols if necessary
    await Promise.all(holdings.filter(h => !h.symbol).map(async h => {
      const { symbol, name } = await this.getSymbolFromName(h.name)
      if (symbol) {
        h.symbol = symbol
      }
      if (name) {
        h.name = name
      }
    }))
    return holdings
  }

  // Real time details
  // precondition: fund with holdings and historic prices
  async getRealTimeDetails (fund: Fund): Promise<Fund.RealTimeDetails> {
    const getTodaysChange = async (holdingTicker: string) => {
      const url = `https://markets.ft.com/data/equities/tearsheet/summary?s=${holdingTicker}`
      const { data } = await http.asyncGet(url)
      const $ = cheerio.load(data)
      let currency, todaysChange
      const price = $('.mod-tearsheet-overview__quote > ul > li:nth-child(1) > span.mod-ui-data-list__label').text().trim()
      let groups = price.match(/Price \((.*)\)/)
      if (groups) {
        currency = groups[1]
      }
      // override by market cap if present (e.g. GBX => GBP)
      const marketCap = $('.mod-tearsheet-key-stats__data th:contains(\'Market cap\') + td').text().trim()
      groups = marketCap.match(/[A-Z]{3}$/)
      if (groups) {
        currency = groups[0]
      }
      if (!currency) {
        log.warn('Currency failed for: %s', holdingTicker)
        currency = null
      }
      try {
        const cell = $('.mod-tearsheet-overview__quote > ul > li:nth-child(2) > .mod-ui-data-list__value').text().trim()
        const groups = cell.match('(.*)/(.*)%')
        todaysChange = +groups[2] / 100
      } catch (err) {
        log.warn('Todays change failed for: %s. Cause: %s', holdingTicker, err.stack)
        todaysChange = NaN
      }
      return { currency, todaysChange }
    }
    const enrichedHoldings = await Promise.map(fund.holdings, async h => {
      const { currency, todaysChange } = h.symbol ? await getTodaysChange(h.symbol) : { currency: null, todaysChange: null }
      return { name: h.name, symbol: h.symbol, currency, todaysChange, weight: h.weight }
    })
    const realTimeDetails = {
      estChange: undefined as number,
      estPrice: undefined as number,
      stdev: undefined as number,
      ci: undefined as [number, number],
      holdings: enrichedHoldings,
      lastUpdated: new Date()
    }
    return fundUtils.enrichRealTimeDetails(realTimeDetails, fund)
  }

  async listCurrencies () {
    const url = 'https://markets.ft.com/data/currencies'
    const { data } = await http.asyncGet(url)
    const $ = cheerio.load(data)
    const currencyOptions = $('form.mod-currency-selector__controls select:nth-of-type(1)').find('option')
    const currencies = _.sortedUniq(currencyOptions
      .map((i, option) => {
        return $(option).attr('value').trim()
      })
      .get()
      .filter((text) => text.length) // filter out empty string
      .sort())
    return currencies
  }

  /**
     * Analogous stream methods below
     */
  streamFundsFromIsins () {
    return streamWrapper.asParallelTransformAsync((csdFund: Fund) => this.getFundFromIsin(csdFund))
  }

  async getSymbolFromName (name: string): Promise<{symbol: string, name: string}> {
    const dropShareClassSuffix = (name: string) => {
      const chunks = name.split(' ')
      if (chunks.length > 1 && _.last(chunks) === _.last(chunks).toUpperCase()) {
        // is share class suffix
        chunks.pop()
      }
      if (chunks.length && _.last(chunks).toLowerCase() === 'class') {
        chunks.pop()
      }
      return chunks.join(' ')
    }
    const dropThePrefix = (name:string) => {
      const prefix = 'the '
      if (name.toLowerCase().startsWith(prefix)) {
        return name.substring(prefix.length)
      }
      return name
    }
    const search = async (name:string) => {
      const url = 'https://markets.ft.com/data/searchapi/searchsecurities'
      const params = {
        query: name
      }
      const { data, status } = await http.asyncGet(url, {
        params,
        responseType: 'json',
        maxRedirects: 0,
        validateStatus: null
      })
      if (status === 200) {
        const security = data.data.security.find((s:any) => s.name.toLowerCase().replace(/-/g, ' ').includes(name.toLowerCase().replace(/-/g, ' ')))
        return { symbol: security && security.symbol, name: security && security.name }
      } else {
        return { symbol: undefined, name: undefined }
      }
    }
    // replace charles stanley keywords with financial times before search
    const replacements = { HLDGS: 'Holdings' }
    for (const [from, to] of Object.entries(replacements)) {
      name = name.replace(new RegExp(from, 'g'), to)
    }
    const candidates = [name, dropThePrefix(name), dropShareClassSuffix(dropThePrefix(name))]
    for (const candidate of candidates) {
      const { symbol, name } = await search(candidate)
      if (symbol) {
        return { symbol, name }
      }
    }
    return { symbol: undefined, name: undefined }
  }

  private getShareClass (shareClass: string, name: string) {
    if (shareClass in this.shareClassMap) {
      return this.shareClassMap[shareClass]
    }
    // otherwise try to infer from name
    const accumulationKeywords = ['(acc)', 'Acc']
    const incomeKeywords = ['(inc)', 'Inc', '(dist)', 'Dist']
    if (accumulationKeywords.some(kw => name.includes(kw))) {
      return Fund.shareClasses.ACC
    }
    if (incomeKeywords.some(kw => name.includes(kw))) {
      return Fund.shareClasses.INC
    }
    return undefined
  }
}
