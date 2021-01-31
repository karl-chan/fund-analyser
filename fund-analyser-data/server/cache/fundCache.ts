import moment from 'moment-business-days'
import * as FundDAO from '../../lib/db/FundDAO'
import Fund from '../../lib/fund/Fund'
import * as fundUtils from '../../lib/util/fundUtils'
import log from '../../lib/util/log'
import * as tmp from '../../lib/util/tmp'
const REFRESH_INTERVAL = moment.duration(15, 'minutes')
const FILE_TMP_CACHE = 'fundCache'

interface Metadata {
    asof: {
        date: Date,
        numUpToDate: number
    }
    stats: any
    statsUpToDate: { min: any, q1: any, median: any, q3: any, max: any, }
    totalFunds: number
}

let fundCache : Fund[] = []
let quickFilterCache: {[isin: string]: string} = {}
let metadata: Metadata
let refreshTask: any = null

async function refresh () {
  const options = {
    projection: { _id: 0, historicPrices: 0, holdings: 0 }
  }
  log.info('Refreshing fund cache...')
  fundCache = await FundDAO.listFunds(options)
  refreshMetadata()
  saveToFile() // don't await to speed up 500ms
  log.info('Fund cache refreshed.')
}

export function get (isins?: string[], options?: any) {
  checkRunning()
  let funds = isins
    ? fundCache.filter(f => isins.includes(f.isin))
    : fundCache
  if (options) {
    const { filterText, showUpToDateOnly } = options
    if (filterText && filterText.trim()) {
      const needle = filterText.trim().toLowerCase()
      funds = funds.filter(f => quickFilterCache[f.isin].includes(needle))
    }
    if (showUpToDateOnly) {
      funds = funds.filter(f => isUpToDate(f, metadata.asof.date))
    }
  }
  return funds
}

export function getMetadata (options?: any) {
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

function getAsOfDate () {
  const today = moment().utc().startOf('day')
  return today.isBusinessDay() ? today.toDate() : today.prevBusinessDay().toDate()
}

export async function start (clean = false) {
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

export function shutdown () {
  clearInterval(refreshTask)
}

function buildQuickFilterCache (funds: Fund[]) {
  const cache: {[isin: string]: string} = {}
  funds.forEach(f => {
    let str = ''
    for (const v of Object.values(f)) {
      switch (typeof v) {
        case 'object':
          str += JSON.stringify(v)
          break
        default:
          str += v
      }
    }
    cache[f.isin] = str.toLowerCase()
  })
  return cache
}

function refreshMetadata () {
  fundCache = fundUtils.enrichSummary(fundCache)
  quickFilterCache = buildQuickFilterCache(fundCache)
  const asofDate = getAsOfDate()
  const fundsUpToDate = fundCache.filter(f => isUpToDate(f, asofDate))
  const asof = {
    date: asofDate,
    numUpToDate: fundsUpToDate.length
  }
  const stats = fundUtils.calcStats(fundCache)
  const statsUpToDate = fundUtils.calcStats(fundsUpToDate)
  const totalFunds = fundCache.length
  metadata = { asof, stats, statsUpToDate, totalFunds }
}

function checkRunning () {
  if (!refreshTask) {
    throw new Error('Fund cache not started yet! Call fundCache.start() before querying cache!')
  }
}

function isUpToDate (f: Fund, asofDate: Date) {
  return f.asof && f.asof.getTime() === asofDate.getTime()
}

async function loadFromFile () {
  ({ fundCache, quickFilterCache, metadata } = await tmp.read(FILE_TMP_CACHE))
  for (const row of fundCache) {
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
