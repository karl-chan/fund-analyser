import { Promise } from 'bluebird'
import * as db from '../util/db'
import log from '../util/log'
import * as math from '../util/math'
import Stock from '../stock/Stock'
import * as _ from 'lodash'
import * as stream from 'stream'
const idField = 'symbol'

export function fromStock (stock: any) {
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

export async function upsertStocks (stocks: any) {
  if (!stocks.length) {
    log.info('No stocks to upsert. Returning...')
    return
  }
  // count all stocks
  const shardCounts = await (Promise as any).map(db.getStocks(), (stockDb: any) => stockDb.countDocuments())
  // find matching ids in shards
  const searchIds = stocks.map((f: any) => f[idField]).filter((val: any) => val)
  const findOptions = {
    query: { _id: { $in: searchIds } },
    projection: { _id: 1 }
  }
  const shardedDocs = await (Promise as any).map(buildFindQuery(findOptions), (query: any) => query.toArray())
  const shardedIds = shardedDocs.map((docs: any) => new Set(docs.map((doc: any) => doc._id)))
  // partition stocks into shards
  const bucketedStocks = shardedIds.map((shard: any) => <Stock[]>[])
  for (const stock of stocks) {
    let shardIdx = shardedIds.findIndex((shard: any) => shard.has(stock[idField]))
    if (shardIdx === -1) {
      // assign to least occupied shard
      shardIdx = math.minIndex(shardCounts)
      shardCounts[shardIdx]++
    }
    bucketedStocks[shardIdx].push(stock)
  }
  const upsertOperation = (stock: any) => {
    const doc = fromStock(stock)
    const query = { _id: stock[idField] }
    const operation = { replaceOne: { filter: query, replacement: doc, upsert: true } }
    return operation
  }
  const bucketedOperations = bucketedStocks.map((bucket: any) => bucket.map(upsertOperation))
  try {
    // @ts-expect-error ts-migrate(7031) FIXME: Binding element 'stockDb' implicitly has an 'any' ... Remove this comment to see the full error message
    await (Promise as any).map(_.zip(db.getStocks(), bucketedOperations), ([stockDb, operations]) => {
      return operations.length ? stockDb.bulkWrite(operations) : []
    })
  } catch (err) {
    log.error('Failed to upsert stocks: %j. Error: %s', stocks, err.stack)
    return
  }
  log.info('Upserted stocks: %j', bucketedStocks.map((stocks: any, i: any) => `${JSON.stringify(stocks.map((f: any) => f[idField]))} in shard ${i}`).join('; '))
}

/**
     *
     * @param options mongodb options
     * @param toPlainObject [optional] boolean - true: to plain object, false: to stock
     */
export async function listStocks (options: any, toPlainObject = false) {
  const shardedDocs = await (Promise as any).map(buildFindQuery(options), (query: any) => query.toArray())
  let docs = _.flatten(shardedDocs)
  // need postprocessing because we are merging from different databases
  if (options && options.sort) {
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    docs = _.orderBy(docs, Object.keys(options.sort), Object.values(options.sort).map(dir => dir === -1 || dir.$meta === 'textScore' ? 'desc' : 'asc'))
  }
  if (options && options.limit) {
    docs = docs.slice(0, options.limit)
  }
  return docs.map(toPlainObject ? _.toPlainObject : toStock)
}

export function streamStocks (options: any, toPlainObject = false) {
  const res = new stream.PassThrough({
    objectMode: true
  });
  (Promise as any).each(buildFindQuery(options), async (query: any) => {
    const stockDbStream = query.transformStream({
      transform: toPlainObject ? _.toPlainObject : toStock
    })
    stockDbStream.pipe(res, { end: false })
    return new Promise((resolve: any, reject: any) => {
      stockDbStream.on('end', resolve)
      stockDbStream.on('error', reject)
    })
  }).then(() => {
    res.end()
  })
  return res
}

export async function deleteStocks (options: any) {
  const queryOpts = _.defaultTo(options.query, {})
  try {
    await (Promise as any).map(db.getStocks(), (stockDb: any) => stockDb.deleteMany(queryOpts))
  } catch (err) {
    log.error('Failed to delete stocks. Error: %s', err.stack)
  }
}

export async function search (text: any, projection: any, limit: any) {
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
const buildFindQuery = (options: any) => {
  const query = (options && options.query) || {}
  const findOptions = {
    projection: options && options.projection,
    sort: options && options.sort,
    limit: options && options.limit
  }
  return db.getStocks().map((stockDb: any) => stockDb.find(query, findOptions))
}
