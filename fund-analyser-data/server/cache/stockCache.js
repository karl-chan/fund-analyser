module.exports = {
    get,
    getMetadata,
    start,
    shutdown
}

const _ = require('lodash')
const moment = require('moment')
const StockDAO = require('../../lib/db/StockDAO')
const log = require('../../lib/util/log')
const stockUtils = require('../../lib/util/stockUtils')
const tmp = require('../../lib/util/tmp')

const REFRESH_INTERVAL = moment.duration(15, 'minutes')
const FILE_TMP_CACHE = 'stockCache'

let stockCache = []
let quickFilterCache = {}
let metadata = {}
let refreshTask = null

async function refresh () {
    const options = {
        projection: { _id: 0, historicPrices: 0 }
    }
    log.info('Refreshing stock cache...')
    stockCache = await StockDAO.listStocks(options)
    refreshMetadata()
    saveToFile() // don't await to speed up 500ms
    log.info('Stock cache refreshed.')
}

function get (symbols, options) {
    checkRunning()
    let stocks = symbols
        ? stockCache.filter(s => symbols.includes(s.symbol))
        : stockCache

    if (options) {
        const { filterText, showUpToDateOnly } = options
        if (filterText && filterText.trim()) {
            const needle = filterText.trim().toLowerCase()
            stocks = stocks.filter(s => quickFilterCache[s.symbol].includes(needle))
        }
        if (showUpToDateOnly) {
            stocks = stocks.filter(s => isUpToDate(s, metadata.asof.date))
        }
    }

    return stocks
}

function getMetadata (options) {
    checkRunning()
    const { stats, statsUpToDate, ...rest } = metadata
    if (options) {
        const { showUpToDateOnly } = options
        if (showUpToDateOnly) {
            return { stats: statsUpToDate, ...rest }
        }
    }
    return { stats, ...rest }
}

async function start (clean) {
    log.info('Warming up stock cache.')
    if (clean) {
        // clean boot
        await refresh()
    } else {
        // try load from cache
        try {
            await loadFromFile()
        } catch (err) {
            await refresh()
        }
    }
    refreshTask = setInterval(refresh, REFRESH_INTERVAL.asMilliseconds())
}

function shutdown () {
    clearInterval(refreshTask)
}

function buildQuickFilterCache (stocks) {
    const cache = {}
    stocks.forEach(s => {
        let str = ''
        for (const v of Object.values(s)) {
            switch (typeof v) {
                case 'object':
                    str += JSON.stringify(v)
                    break
                default:
                    str += v
            }
        }
        cache[s.symbol] = str.toLowerCase()
    })
    return cache
}

function refreshMetadata () {
    stockCache = stockUtils.enrichSummary(stockCache)
    quickFilterCache = buildQuickFilterCache(stockCache)
    const asofDate = _.max(stockCache.map(s => s.asof))
    const stocksUpToDate = stockCache.filter(s => isUpToDate(s, asofDate))
    const asof = {
        date: asofDate,
        numUpToDate: stocksUpToDate.length
    }
    const stats = stockUtils.calcStats(stockCache)
    const statsUpToDate = stockUtils.calcStats(stocksUpToDate)
    const totalStocks = stockCache.length
    metadata = { asof, stats, statsUpToDate, totalStocks }
}

function checkRunning () {
    if (!refreshTask) {
        throw new Error('Stock cache not started yet! Call stockCache.start() before querying cache!')
    }
}

function isUpToDate (s, asofDate) {
    return s.asof && s.asof.getTime() === asofDate.getTime()
}

async function loadFromFile () {
    ({ stockCache, quickFilterCache, metadata } = await tmp.read(FILE_TMP_CACHE))
    for (const row of stockCache) {
        row.asof = new Date(row.asof)
    }
    metadata.asof.date = new Date(metadata.asof.date)
    log.info('Stock cache loaded from file.')
}

async function saveToFile () {
    const bundle = { stockCache, quickFilterCache, metadata }
    await tmp.write(FILE_TMP_CACHE, bundle, REFRESH_INTERVAL.asSeconds())
    log.info('Stock cache saved to file.')
}
