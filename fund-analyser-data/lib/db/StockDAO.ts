import { Promise } from 'bluebird'
import * as _ from 'lodash'
import * as stream from 'stream'
import Stock from '../stock/Stock'
import * as db from '../util/db'
import log from '../util/log'
import * as math from '../util/math'
const idField = 'symbol'

export interface Options {
  query?: object
  projection?: object
  sort?: object
  limit?: number
}

export function fromStock (stock: Stock) {
  return {
    _id: stock[idField],
    ..._.toPlainObject(stock)
  }
}

export function toStock (entry: any) {
  delete entry._id
  let builder = Stock.builder(entry.isin)
  builder = _.isNil(entry.symbol) ? builder : builder.symbol(entry.symbol)
  builder = _.isNil(entry.name) ? builder : builder.name(entry.name)
  builder = _.isNil(entry.returns) ? builder : builder.returns(entry.returns)
  builder = _.isNil(entry.asof) ? builder : builder.asof(entry.asof)
  builder = _.isNil(entry.indicators) ? builder : builder.indicators(entry.indicators)
  builder = _.isNil(entry.realTimeDetails) ? builder : builder.realTimeDetails(entry.realTimeDetails)
  if (!_.isNil(entry.historicPrices)) {
    builder = builder.historicPrices(entry.historicPrices.map((e: any) => new Stock.HistoricPrice(e.date, e.price, e.volume)))
  }
  return builder.build()
}

export async function upsertStocks (stocks: Stock[]) {
  if (!stocks.length) {
    log.info('No stocks to upsert. Returning...')
    return
  }
  // count all stocks
  const shardCounts = await Promise.map(db.getStocks(), stockDb => stockDb.countDocuments())
  // find matching ids in shards
  const searchIds = stocks.map(s => s[idField]).filter(val => val)
  const findOptions = {
    query: { _id: { $in: searchIds } },
    projection: { _id: 1 }
  }
  const shardedDocs = await Promise.map(buildFindQuery(findOptions), query => query.toArray())
  const shardedIds = shardedDocs.map(docs => new Set(docs.map(doc => doc._id)))
  // partition stocks into shards
  const bucketedStocks = shardedIds.map(() => <Stock[]>[])
  for (const stock of stocks) {
    let shardIdx = shardedIds.findIndex(shard => shard.has(stock[idField]))
    if (shardIdx === -1) {
      // assign to least occupied shard
      shardIdx = math.minIndex(shardCounts)
      shardCounts[shardIdx]++
    }
    bucketedStocks[shardIdx].push(stock)
  }
  const upsertOperation = (stock: Stock) => {
    const doc = fromStock(stock)
    const query = { _id: stock[idField] }
    const operation = { replaceOne: { filter: query, replacement: doc, upsert: true } }
    return operation
  }
  const bucketedOperations = bucketedStocks.map(bucket => bucket.map(upsertOperation))
  try {
    await Promise.map(_.zip(db.getStocks(), bucketedOperations), ([stockDb, operations]) => {
      return operations.length ? stockDb.bulkWrite(operations) : Promise.resolve(undefined)
    })
  } catch (err) {
    log.error('Failed to upsert stocks: %j. Error: %s', stocks, err.stack)
    return
  }
  log.info('Upserted stocks: %j', bucketedStocks.map((stocks, i) => `${JSON.stringify(stocks.map(f => f[idField]))} in shard ${i}`).join('; '))
}

/**
     *
     * @param options mongodb options
     * @param toPlainObject [optional] boolean - true: to plain object, false: to stock
     */
export async function listStocks (options: Options, toPlainObject = false) {
  const shardedDocs = await Promise.map(buildFindQuery(options), query => query.toArray())
  let docs = _.flatten(shardedDocs)
  // need postprocessing because we are merging from different databases
  if (options && options.sort) {
    docs = _.orderBy(docs, Object.keys(options.sort), Object.values(options.sort).map(dir => dir === -1 || dir.$meta === 'textScore' ? 'desc' : 'asc'))
  }
  if (options && options.limit) {
    docs = docs.slice(0, options.limit)
  }
  return docs.map(toPlainObject ? _.toPlainObject : toStock)
}

export function streamStocks (options: Options, toPlainObject = false) {
  const res = new stream.PassThrough({
    objectMode: true
  })
  Promise.each(buildFindQuery(options), async query => {
    const stockDbStream = query.stream({
      transform: toPlainObject ? _.toPlainObject : toStock
    })
    stockDbStream.pipe(res, { end: false })
    return new Promise((resolve, reject) => {
      stockDbStream.on('end', resolve)
      stockDbStream.on('error', reject)
    })
  }).then(() => {
    res.end()
  })
  return res
}

export async function deleteStocks (options: Options) {
  const queryOpts = _.defaultTo(options.query, {})
  try {
    await Promise.map(db.getStocks(), stockDb => stockDb.deleteMany(queryOpts))
  } catch (err) {
    log.error('Failed to delete stocks. Error: %s', err.stack)
  }
}

export async function search (text: string, projection: object, limit: number) {
  const options = {
    query: { $text: { $search: text } },
    projection: { ...projection, score: { $meta: 'textScore' } },
    sort: { score: { $meta: 'textScore' } },
    limit
  }
  return listStocks(options, true)
}

/**
     * Executes mongodb find query
     * @param options {
     *  query: obj,
     *  projection: obj,
     *  sort: int,
     *  limit: int
     *  }
     */
const buildFindQuery = (options: Options) => {
  const query = (options && options.query) || {}
  const findOptions = {
    projection: options && options.projection,
    sort: options && options.sort,
    limit: options && options.limit
  }
  return db.getStocks().map(stockDb => stockDb.find(query, findOptions))
}
