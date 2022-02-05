import BatchStream from 'batch-stream'
import { Promise } from 'bluebird'
import moment from 'moment-business-days'
import * as StockDAO from '../../lib/db/StockDAO'
import Stock from '../../lib/stock/Stock'
import StockFactory from '../../lib/stock/StockFactory'
import * as lang from '../../lib/util/lang'
import log from '../../lib/util/log'
import * as streamWrapper from '../../lib/util/streamWrapper'

/**
 * Update stocks that need to be updated based on asof time
 * @returns {Promise.<void>}
 */
export default async function updateStocks () {
  const today = moment().utc().startOf('day')

  const stockFactory = new StockFactory()
  const allSymbols = await stockFactory.symbolProvider.getSymbols()

  const docs = await StockDAO.listStocks({ projection: { symbol: 1, asof: 1 } })
  const oldSymbols = docs.map((s: any) => s.symbol)

  const deleteSymbols = lang.setDifference(oldSymbols, allSymbols)
  await StockDAO.deleteStocks({ query: { symbol: { $in: deleteSymbols } } })
  log.info('Deleted old symbols: %s (%d)', JSON.stringify(deleteSymbols), deleteSymbols.length)

  const upsertSymbols = today.isHoliday() ? [] : allSymbols
  log.info('Symbols to update: %s (%d)', JSON.stringify(upsertSymbols), upsertSymbols.length)

  const stockStream = stockFactory.streamStocksFromSymbols(upsertSymbols)
  const stockValidFilter = streamWrapper.asFilterAsync(isStockValid)
  const upsertStockStream = streamWrapper.asWritableAsync(async (stocks: any) => {
    await StockDAO.upsertStocks(stocks)
  })

  await new Promise((resolve, reject) => {
    const stream = stockStream
      .pipe(stockValidFilter)
      .pipe(new BatchStream({ size: 5 }))
      .pipe(upsertStockStream)
    stream.on('finish', () => {
      log.info('Finished updating stocks')
      resolve()
    })
    stream.on('error', err => {
      log.error('Fatal error, aborting updateStocks: %s', err.stack)
      reject(err)
    })
  })

  // delete stocks with no data
  await StockDAO.deleteStocks({ query: { name: { $eq: null } } })
  log.info('Deleted stocks without names')

  // delete outdated stocks
  const cutoffDate = today.subtract(1, 'week').toDate()
  await StockDAO.deleteStocks({ query: { asof: { $lt: cutoffDate } } })
  log.info('Deleted outdated stocks')
}

async function isStockValid (stock: Stock) {
  if (!stock.isValid()) {
    log.warn('Stock is not valid: %j. Skipping upsert.', stock)
    return false
  }
  log.silly('Stock is valid: %s', stock.symbol)
  return true
}
