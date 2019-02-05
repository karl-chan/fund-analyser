const Fund = require('./Fund')
const Currency = require('../currency/Currency')
const math = require('../util/math')
const fundUtils = require('../util/fundUtils')
const Http = require('../util/http')
const log = require('../util/log')
const properties = require('../util/properties')
const streamWrapper = require('../util/streamWrapper')

const _ = require('lodash')
const cheerio = require('cheerio')
const moment = require('moment')
const Promise = require('bluebird')

const http = new Http({
    maxParallelConnections: properties.get('fund.financialtimes.max.parallel.connections'),
    maxAttempts: properties.get('fund.financialtimes.max.attempts'),
    retryInterval: properties.get('fund.financialtimes.retry.interval')
})

class FinancialTimes {
    constructor () {
        this.fundTypeMap = {
            'Open Ended Investment Company': Fund.types.OEIC,
            'SICAV': Fund.types.OEIC,
            'FCP': Fund.types.OEIC,
            'Unit Trust': Fund.types.UNIT
        }
        this.shareClassMap = {
            'Income': Fund.shareClasses.INC,
            'Accumulation': Fund.shareClasses.ACC
        }
        this.lookback = properties.get('fund.financialtimes.lookback.days')
    }

    async getFundsFromIsins (isins) {
        return Promise.map(isins, this.getFundFromIsin.bind(this))
    }

    async getFundFromIsin (isin) {
        if (!isin) {
            return new Fund()
        }
        /* Overload to accept partial fund case from Charles Stanley */
        const sedol = isin instanceof Fund ? isin.sedol : undefined
        const bidAskSpread = isin instanceof Fund ? isin.bidAskSpread : undefined
        const entryCharge = isin instanceof Fund ? isin.entryCharge : undefined
        let fund = isin instanceof Fund ? isin : undefined
        if (fund) {
            isin = fund.isin
        }

        log.silly('Get fund from isin: %s', isin)
        const [summary, performance, historicPrices, holdings] = await Promise.all([
            this.getSummary(isin),
            this.getPerformance(isin),
            this.getHistoricPrices(isin),
            this.getHoldings(isin, fund)
        ])

        fund = Fund.Builder(isin)
            .sedol(sedol)
            .name(summary.name)
            .type(summary.type)
            .shareClass(summary.shareClass)
            .frequency(summary.frequency)
            .ocf(summary.ocf)
            .amc(summary.amc)
            .entryCharge(entryCharge)
            .exitCharge(summary.exitCharge)
            .bidAskSpread(bidAskSpread)
            .holdings(holdings)
            .historicPrices(historicPrices)
            .returns(performance)
            .asof(_.isEmpty(historicPrices) ? undefined : _.last(historicPrices).date)
            .build()

        if (!historicPrices.length) {
            log.warn('No data found for isin: ' + isin)
        } else {
            log.debug('Got fund from isin %s', isin)
            log.silly('Isin: %s. Fund: %j', isin, fund)
        }

        // try enrich with real time details
        try {
            const realTimeDetails = await this.getRealTimeDetails(fund)
            fund.realTimeDetails = realTimeDetails
        } catch (err) {
            log.error('Failed to get real time details for isin: %s. Cause: %s', isin, err.stack)
        }
        return fund
    }

    async getSummary (isin) {
        const url = `https://markets.ft.com/data/funds/tearsheet/summary?s=${isin}`
        const { body } = await http.asyncGet(url)

        const $ = cheerio.load(body)
        const name = $(`body > div.o-grid-container.mod-container > div:nth-child(2) > section:nth-child(1) 
                > div > div > div.mod-tearsheet-overview__overview.clearfix > div.mod-tearsheet-overview__header 
                > h1.mod-tearsheet-overview__header__name.mod-tearsheet-overview__header__name--large`).text()

        const leftTable = $(`table.mod-ui-table.mod-ui-table--two-column.mod-profile-and-investment-app__table--profile`)
        const type = leftTable.find(`th:contains('Fund type') + td`).text()
        const shareClass = leftTable.find(`th:contains('Income treatment') + td`).text()

        const rightTable = $(`table.mod-ui-table.mod-ui-table--two-column.mod-profile-and-investment-app__table--invest`)
        const frequency = rightTable.find(`th:contains('Pricing frequency') + td`).text()
        const ocf = rightTable.find(`th:contains('Net expense ratio') + td`).text()
        const amc = rightTable.find(`th:contains('Max annual charge') + td`).text()
        const entryCharge = rightTable.find(`th:contains('Initial charge') + td`).text()
        const exitCharge = rightTable.find(`th:contains('Exit charge') + td`).text()

        const summary = {
            name: name,
            type: this.fundTypeMap[type],
            shareClass: this._getShareClass(shareClass, name),
            frequency: frequency,
            ocf: math.pcToFloat(ocf),
            amc: math.pcToFloat(amc),
            entryCharge: math.pcToFloat(entryCharge),
            exitCharge: math.pcToFloat(exitCharge)
        }
        return summary
    }

    async getPerformance (isin) {
        const url = `https://markets.ft.com/data/funds/tearsheet/performance?s=${isin}`
        const { body } = await http.asyncGet(url)

        const $ = cheerio.load(body)
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

    async getHistoricPrices (isin) {
        let url = `https://markets.ft.com/data/funds/tearsheet/charts?s=${isin}`
        let { body } = await http.asyncGet(url)

        const $ = cheerio.load(body)

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

        const url2 = `https://markets.ft.com/data/chartapi/series`

        const { body: body2 } = await http.asyncPost(url2, {
            headers: {
                'content-type': 'application/json'
            },
            form: {
                'days': this.lookback,
                'dataPeriod': 'Day',
                'returnDateType': 'ISO8601',
                'elements': [{ 'Type': 'price', 'Symbol': symbol }]
            }
        })

        // In case of failure, simply return an empty array and continue
        try {
            const series = JSON.parse(body2)
            const dates = series.Dates
            const prices = series.Elements[0].ComponentSeries.find(s => s.Type === 'Close').Values
            const historicPrices = _.zipWith(dates, prices, (dateString, price) => {
                const date = moment(dateString).toDate()
                return new Fund.HistoricPrice(date, price)
            })
            return historicPrices
        } catch (err) {
            log.warn('Failed to retrieve chartapi historic prices for isin: %s', isin)
            return []
        }
    }

    async getHistoricExchangeRates (base, quote) {
        const entries = await this.getHistoricPrices(`${base}${quote}`)
        return entries.map(entry => new Currency.HistoricRate(entry.date, entry.price))
    }

    async getHoldings (isin, fallbackFund) {
        const url = `https://markets.ft.com/data/funds/tearsheet/holdings?s=${isin}`
        const { body } = await http.asyncGet(url)

        const $ = cheerio.load(body)
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
    async getRealTimeDetails (fund) {
        const getTodaysChange = async holdingTicker => {
            const url = `https://markets.ft.com/data/equities/tearsheet/summary?s=${holdingTicker}`

            const { body } = await http.asyncGet(url)
            const $ = cheerio.load(body)
            let currency, todaysChange

            const price = $('.mod-tearsheet-overview__quote > ul > li:nth-child(1) > span.mod-ui-data-list__label').text().trim()
            let groups = price.match(/Price \((.*)\)/)
            if (groups) {
                currency = groups[1]
            }
            // override by market cap if present (e.g. GBX => GBP)
            const marketCap = $(`.mod-tearsheet-key-stats__data th:contains('Market cap') + td`).text().trim()
            groups = marketCap.match(/[A-Z]{3}$/)
            if (groups) {
                currency = groups[0]
            }
            if (!currency) {
                log.warn('Currency failed for: %s', holdingTicker)
            }

            try {
                const cell = $('.mod-tearsheet-overview__quote > ul > li:nth-child(2) > .mod-ui-data-list__value').text().trim()
                const groups = cell.match('(.*)/(.*)%')
                todaysChange = groups[2] / 100
            } catch (err) {
                log.warn('Todays change failed for: %s. Cause: %s', holdingTicker, err.stack)
            }
            return { currency, todaysChange }
        }

        const enrichedHoldings = await Promise.map(fund.holdings, async h => {
            const { currency, todaysChange } = h.symbol ? await getTodaysChange(h.symbol) : { currency: null, todaysChange: null }
            return { name: h.name, ticker: h.symbol, currency, todaysChange, weight: h.weight }
        })

        const realTimeDetails = { holdings: enrichedHoldings, lastUpdated: new Date() }
        return fundUtils.enrichRealTimeDetails(realTimeDetails, fund)
    }

    async listCurrencies () {
        const url = 'https://markets.ft.com/data/currencies'

        const { body } = await http.asyncGet(url)
        const $ = cheerio.load(body)
        const currencyOptions = $('form.mod-currency-selector__controls select:nth-of-type(1)').find('option')
        const currencies = _.sortedUniq(currencyOptions
            .map((i, option) => {
                return $(option).attr('value').trim()
            })
            .get()
            .filter(text => text.length) // filter out empty string
        )
        return currencies
    }

    /**
     * Analogous stream methods below
     */
    streamFundsFromIsins () {
        return streamWrapper.asParallelTransformAsync(this.getFundFromIsin.bind(this))
    }

    async getSymbolFromName (name) {
        const dropShareClassSuffix = name => {
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

        const dropThePrefix = name => {
            const prefix = 'the '
            if (name.toLowerCase().startsWith(prefix)) {
                return name.substring(prefix.length)
            }
            return name
        }

        const search = async name => {
            const url = 'https://markets.ft.com/data/searchapi/searchsecurities'
            const qs = {
                query: name
            }
            const { body } = await http.asyncGet(url, { qs })
            const { data } = JSON.parse(body)
            const security = data.security.find(s => s.name.toLowerCase().replace(/-/g, ' ').includes(name.toLowerCase().replace(/-/g, ' ')))
            return { symbol: security && security.symbol, name: security && security.name }
        }

        // replace charles stanley keywords with financial times before search
        const replacements = { 'HLDGS': 'Holdings' }
        for (let [from, to] of Object.entries(replacements)) {
            name = name.replace(new RegExp(from, 'g'), to)
        }

        const candidates = [name, dropThePrefix(name), dropShareClassSuffix(dropThePrefix(name))]
        for (let candidate of candidates) {
            const { symbol, name } = await search(candidate)
            if (symbol) { return { symbol, name } }
        }
        return { symbol: undefined, name: undefined }
    }

    _getShareClass (shareClass, name) {
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

module.exports = FinancialTimes
