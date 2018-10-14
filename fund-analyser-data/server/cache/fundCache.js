module.exports = {
    get,
    getMetadata,
    start,
    shutdown
}

const _ = require('lodash')
const moment = require('moment')
const FundDAO = require('../../lib/db/FundDAO')
const log = require('../../lib/util/log')
const fundUtils = require('../../lib/util/fundUtils')
const tmp = require('../../lib/util/tmp')

const REFRESH_INTERVAL = moment.duration(15, 'minutes')
const FILE_TMP_CACHE = 'fundCache'

let fundCache = []
let quickFilterCache = []
let metadata = {}
let refreshTask = null

async function refresh () {
    const options = {
        projection: { _id: 0, historicPrices: 0 }
    }
    log.info('Refreshing fund cache...')
    fundCache = await FundDAO.listFunds(options)
    refreshMetadata()
    saveToFile() // don't await to speed up 500ms
    log.info('Fund cache refreshed.')
}

function get (isins, options) {
    checkRunning()
    let funds = _.clone(
        isins
            ? fundCache.filter(f => isins.includes(f.isin))
            : fundCache)

    if (options) {
        const { filterText } = options
        if (filterText && filterText.trim()) {
            funds = []
            for (let [i, cache] of quickFilterCache.entries()) {
                if (cache.includes(filterText.trim().toLowerCase())) {
                    funds.push(fundCache[i])
                }
            }
        }
    }

    return funds
}

function getMetadata () {
    checkRunning()
    return metadata
}

async function start (clean) {
    log.info('Warming up fund cache.')
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

function buildQuickFilterCache (funds) {
    return funds.map(f => {
        let s = ''
        for (let v of Object.values(f)) {
            switch (typeof v) {
            case 'object':
                s += JSON.stringify(v)
                break
            default:
                s += v
            }
        }
        return s.toLowerCase()
    })
}

function refreshMetadata () {
    fundCache = fundUtils.enrichSummary(fundCache)
    quickFilterCache = buildQuickFilterCache(fundCache)

    const asofDate = _.max(fundCache.map(f => f.asof))
    const asof = {
        date: asofDate,
        numUpToDate: fundCache.filter(f => f.asof && asofDate && f.asof.getTime() === asofDate.getTime()).length
    }
    const stats = fundUtils.calcStats(fundCache)
    const totalFunds = fundCache.length
    metadata = { asof, stats, totalFunds }
}

function checkRunning () {
    if (!refreshTask) {
        throw new Error('Fund cache not started yet! Call fundCache.start() before querying cache!')
    }
}

async function loadFromFile () {
    ({ fundCache, quickFilterCache, metadata } = await tmp.read(FILE_TMP_CACHE))
    for (let row of fundCache) {
        row.asof = new Date(row.asof)
    }
    metadata.asof.date = new Date(metadata.asof.date)
    log.info('Fund cache loaded from file.')
}

async function saveToFile () {
    const bundle = { fundCache, quickFilterCache, metadata }
    await tmp.write(FILE_TMP_CACHE, bundle, REFRESH_INTERVAL.asSeconds())
    log.info('Fund cache saved to file.')
}
