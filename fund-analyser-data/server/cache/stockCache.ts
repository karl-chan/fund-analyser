import moment from 'moment-business-days'
import * as StockDAO from '../../lib/db/StockDAO'
import Stock from '../../lib/stock/Stock'
import log from '../../lib/util/log'
import * as stockUtils from '../../lib/util/stockUtils'
import * as tmp from '../../lib/util/tmp'

const REFRESH_INTERVAL = moment.duration(15, 'minutes')
const FILE_TMP_CACHE = 'stockCache'

interface Metadata {
    asof: {
        date: Date,
        numUpToDate: number
    }
    stats: any
    statsUpToDate: { min: any, q1: any, median: any, q3: any, max: any, }
    totalStocks: number
}

let stockCache: Stock[] = []
let quickFilterCache: {[symbol: string]: string} = {}
let metadata: Metadata
// eslint-disable-next-line no-undef
let refreshTask: NodeJS.Timeout

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

export function get (symbols?: any, options?: any) {
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

export function shutdown () {
  clearInterval(refreshTask)
}

function buildQuickFilterCache (stocks: Stock[]) {
  const cache: {[symbol:string]: string} = {}
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
  const asofDate = getAsOfDate()
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

function isUpToDate (s: any, asofDate: any) {
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
