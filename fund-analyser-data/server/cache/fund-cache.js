module.exports = {
    get,
    getMetadata,
    start,
    shutdown
}

const _ = require('lodash')
const moment = require('moment')
const log = require('../../lib/util/log')
const db = require('../../lib/util/db')
const math = require('../../lib/util/math')

const REFRESH_INTERVAL = moment.duration(15, 'minutes')

let fundCache = []
let metadata = {}
let refreshTask = null

async function refresh () {
    const query = {}
    const options = {
        projection: { _id: 0, historicPrices: 0, percentiles: 0 }
    }
    log.info('Refreshing fund cache...')
    fundCache = await db.getFunds().find(query, options).toArray()
    fundCache = math.enrichSummary(fundCache)
    fundCache = addQuickFilter(fundCache)
    log.info('Fund cache refreshed.')

    refreshMetadata()
}

function get (isins, {filterText}) {
    checkRunning()
    let funds = _.clone(
        isins
            ? fundCache.filter(f => isins.includes(f.isin))
            : fundCache)

    if (filterText && filterText.trim()) {
        funds = funds.filter(f => f.quickFilterCache.includes(filterText.trim().toLowerCase()))
    }
    return removeQuickFilter(funds)
}

function getMetadata () {
    checkRunning()
    return metadata
}

async function start () {
    log.info('Warming up fund cache.')
    await refresh()
    refreshTask = setInterval(refresh, REFRESH_INTERVAL.asMilliseconds())
}

function shutdown () {
    clearInterval(refreshTask)
}

function addQuickFilter (funds) {
    funds.forEach(f => {
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
        f.quickFilterCache = s.toLowerCase()
    })
    return funds
}

function removeQuickFilter (funds) {
    return funds.map(f => {
        const {quickFilterCache, ...rest} = f
        return rest
    })
}

function refreshMetadata () {
    const asof = _.max(fundCache.map(f => f.asof))
    const stats = math.calcStats(fundCache)
    metadata = {asof, stats}
}

function checkRunning () {
    if (!refreshTask) {
        throw new Error('Fund cache not started yet! Call fundCache.start() before querying cache!')
    }
}
