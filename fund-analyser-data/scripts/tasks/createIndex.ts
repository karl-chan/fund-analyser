import { Promise } from 'bluebird'
import * as db from '../../lib/util/db'
import log from '../../lib/util/log'

/**
 * Create index on popular fields for sorting
 */
export default async function createIndex () {
  await Promise.all([
    createFundsIndex(),
    createStocksIndex(),
    createSimilarFundsIndex(),
    createCurrencyIndex()
  ])
}

async function createFundsIndex () {
  await Promise.map(db.getFunds(), async (fundDb: any) => {
    try {
      await fundDb.dropIndexes()
    } catch (ignored) { }
  })
  log.info('Dropped fund indexes')
  const columns = ['isin', 'asof']
  for (const col of columns) {
    await Promise.map(db.getFunds(), (fundDb: any) => fundDb.createIndex({ [col]: 1 }, { background: true }))
  }
  // text index for searching
  await Promise.map(db.getFunds(), (fundDb: any) => fundDb.createIndex({ isin: 'text', sedol: 'text', name: 'text', 'holdings.name': 'text', 'holdings.symbol': 'text' }, { background: true, weights: { name: 10, isin: 5, sedol: 5, 'holdings.name': 1, 'holdings.symbol': 1 } }))
  log.info('Created fund indexes')
}

async function createStocksIndex () {
  await Promise.map(db.getStocks(), async (stockDb: any) => {
    try {
      await stockDb.dropIndexes()
    } catch (ignored) { }
  })
  log.info('Dropped stock indexes')
  const columns = ['symbol', 'asof']
  for (const col of columns) {
    await Promise.map(db.getStocks(), (stockDb: any) => stockDb.createIndex({ [col]: 1 }, { background: true }))
  }
  // text index for searching
  await Promise.map(db.getStocks(), (stockDb: any) => stockDb.createIndex({ symbol: 'text', name: 'text' }, { background: true, weights: { name: 10, symbol: 5 } }))
  log.info('Created stock indexes')
}

async function createSimilarFundsIndex () {
  try {
    await db.getSimilarFunds().dropIndexes()
  } catch (ignored) { }
  log.info('Dropped similarfunds indexes')
  await db.getSimilarFunds().createIndex({ isin: 1 }, { background: true })
  log.info('Created similarfunds indexes')
}

async function createCurrencyIndex () {
  try {
    await db.getCurrencies().dropIndexes()
  } catch (ignored) { }
  log.info('Dropped currency indexes')
  await db.getCurrencies().createIndex({ quote: 1 }, { background: true })
  log.info('Created currency indexes')
}
