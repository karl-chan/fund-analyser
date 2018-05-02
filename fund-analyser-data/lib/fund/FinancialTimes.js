module.exports = FinancialTimes

const Fund = require('./Fund.js')
const math = require('../util/math.js')
const http = require('../util/http.js')
const log = require('../util/log.js')
const properties = require('../util/properties.js')
const streamWrapper = require('../util/streamWrapper.js')

const _ = require('lodash')
const async = require('async')
const cheerio = require('cheerio')
const moment = require('moment')

function FinancialTimes () {
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

FinancialTimes.prototype.getFundsFromIsins = function (isins, callback) {
    async.map(isins, this.getFundFromIsin.bind(this), callback)
}

FinancialTimes.prototype.getFundFromIsin = function (isin, callback) {
    if (!isin) {
        return callback(null, new Fund())
    }
    /* Overload to accept partial fund case from Charles Stanley */
    const sedol = isin instanceof Fund ? isin.sedol : undefined
    const bidAskSpread = isin instanceof Fund ? isin.bidAskSpread : undefined
    const entryCharge = isin instanceof Fund ? isin.entryCharge : undefined
    isin = isin instanceof Fund ? isin.isin : isin

    async.parallel([
        this.getSummary.bind(this, isin),
        this.getPerformance.bind(this, isin),
        this.getHistoricPrices.bind(this, isin),
        this.getHoldings.bind(this, isin)
    ], (err, results) => {
        if (err) {
            return callback(err)
        }
        const [summary, performance, historicPrices, holdings] = results

        const fund = new Fund.Builder(isin)
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
            log.debug('Got fund from isin %s: %j', isin, fund)
        }
        return callback(null, fund)
    })
}

FinancialTimes.prototype.getSummary = function (isin, callback) {
    const url = `https://markets.ft.com/data/funds/tearsheet/summary?s=${isin}`
    http.gets(url, (err, res, body) => {
        if (err) {
            return callback(err)
        }
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
            shareClass: this.shareClassMap[shareClass],
            frequency: frequency,
            ocf: math.pcToFloat(ocf),
            amc: math.pcToFloat(amc),
            entryCharge: math.pcToFloat(entryCharge),
            exitCharge: math.pcToFloat(exitCharge)
        }
        return callback(null, summary)
    })
}

FinancialTimes.prototype.getPerformance = function (isin, callback) {
    const url = `https://markets.ft.com/data/funds/tearsheet/performance?s=${isin}`
    http.gets(url, (err, res, body) => {
        if (err) {
            return callback(err)
        }
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
        return callback(null, performance)
    })
}

FinancialTimes.prototype.getHistoricPrices = function (isin, callback) {
    const url = `https://markets.ft.com/data/funds/tearsheet/charts?s=${isin}`
    http.gets(url, (err, res, body) => {
        if (err) {
            return callback(err)
        }
        const $ = cheerio.load(body)

        // In case of failure, simply return an empty array and continue
        let symbol
        try {
            symbol = JSON.parse($(`body > div.o-grid-container.mod-container > div.ichart-container 
                > div:nth-child(1) > section:nth-child(1) > div > div 
                > div.mod-ui-overlay.clearfix.mod-overview-quote-app-overlay > div > div 
                > section.mod-tearsheet-add-to-watchlist`).attr('data-mod-config')).xid
        } catch (err) {
            return callback(null, [])
        }
        const url = `https://markets.ft.com/data/chartapi/series`

        http.posts({
            url: url,
            headers: {
                'content-type': 'application/json'
            },
            form: {
                'days': this.lookback,
                'dataPeriod': 'Day',
                'returnDateType': 'ISO8601',
                'elements': [{ 'Type': 'price', 'Symbol': symbol }]
            }
        }, (err, res, body) => {
            if (err) {
                return callback(err)
            }
            // In case of failure, simply return an empty array and continue
            try {
                const series = JSON.parse(body)
                const dates = series.Dates
                const prices = series.Elements[0].ComponentSeries.find(s => s.Type === 'Close').Values
                const historicPrices = _.zipWith(dates, prices, (dateString, price) => {
                    const date = moment(dateString).toDate()
                    return new Fund.HistoricPrice(date, price)
                })
                return callback(null, historicPrices)
            } catch (err) {
                return callback(null, [])
            }
        })
    })
}

FinancialTimes.prototype.getHoldings = function (isin, callback) {
    const url = `https://markets.ft.com/data/funds/tearsheet/holdings?s=${isin}`
    http.gets(url, (err, res, body) => {
        if (err) {
            return callback(err)
        }
        const $ = cheerio.load(body)
        const table = $(`body > div.o-grid-container.mod-container > div:nth-child(3) > section 
                > div:nth-child(3) > div > div > table`)
        const tbody = $('body').html('<tbody></tbody>').append(table.children().not('thead, tfoot'))
        const holdings = tbody.find('tr').map((i, tr) => {
            const company = $(tr).find('td:nth-child(1)')
            const name = company.has('a').length ? company.find('a').text() : company.text()
            const symbol = company.find('span').text()
            const weight = math.pcToFloat($(tr).find('td:nth-child(3)').text())
            return new Fund.Holding(name, symbol, weight)
        }).get()
        return callback(null, holdings)
    })
}

// Real time details
// precondition: fund with holdings and historic prices
FinancialTimes.prototype.getRealTimeDetails = async fund => {
    const getTodaysChange = async holdingTicker => {
        const url = `https://markets.ft.com/data/equities/tearsheet/summary?s=${holdingTicker}`
        return new Promise((resolve, reject) => {
            http.gets(url, (err, res, body) => {
                if (err) {
                    return reject(err)
                }
                const $ = cheerio.load(body)
                const cell = $('.mod-tearsheet-overview__quote > ul > li:nth-child(2) > .mod-ui-data-list__value').text().trim()
                const groups = cell.match('(.*)/(.*)%')
                const todaysChange = groups[2] / 100
                return resolve(todaysChange)
            })
        })
    }

    const todaysChanges = await Promise.all(fund.holdings.map(async h => {
        const change = h.symbol ? await getTodaysChange(h.symbol) : null
        return {name: h.name, ticker: h.symbol, todaysChange: change, weight: h.weight}
    }))

    const realTimeDetails = { holdings: todaysChanges }
    return math.enrichRealTimeDetails(realTimeDetails, fund)
}

/**
 * Analogous stream methods below
 */
FinancialTimes.prototype.streamFundsFromIsins = function () {
    return streamWrapper.asParallelTransform(this.getFundFromIsin.bind(this))
}
