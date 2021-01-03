import { Promise } from 'bluebird'
import Fund from '../fund/Fund'
import * as db from '../util/db'
import log from '../util/log'
import * as csv from '../util/csv'
import * as math from '../util/math'
import * as _ from 'lodash'
import * as stream from 'stream'
const idField = 'sedol'

export function fromFund (fund: any) {
  return {
    _id: fund[idField],
    ..._.toPlainObject(fund)
  }
}

export function toFund (entry: any) {
  delete entry._id
  let builder = Fund.builder(entry.isin)
  builder = _.isNil(entry.sedol) ? builder : builder.sedol(entry.sedol)
  builder = _.isNil(entry.name) ? builder : builder.name(entry.name)
  builder = _.isNil(entry.type) ? builder : builder.type(entry.type)
  builder = _.isNil(entry.shareClass) ? builder : builder.shareClass(entry.shareClass)
  builder = _.isNil(entry.frequency) ? builder : builder.frequency(entry.frequency)
  builder = _.isNil(entry.ocf) ? builder : builder.ocf(entry.ocf)
  builder = _.isNil(entry.amc) ? builder : builder.amc(entry.amc)
  builder = _.isNil(entry.entryCharge) ? builder : builder.entryCharge(entry.entryCharge)
  builder = _.isNil(entry.exitCharge) ? builder : builder.exitCharge(entry.exitCharge)
  builder = _.isNil(entry.bidAskSpread) ? builder : builder.bidAskSpread(entry.bidAskSpread)
  builder = _.isNil(entry.returns) ? builder : builder.returns(entry.returns)
  builder = _.isNil(entry.asof) ? builder : builder.asof(entry.asof)
  builder = _.isNil(entry.indicators) ? builder : builder.indicators(entry.indicators)
  builder = _.isNil(entry.realTimeDetails) ? builder : builder.realTimeDetails(entry.realTimeDetails)
  if (!_.isNil(entry.holdings)) {
    builder = builder.holdings(entry.holdings.map((e: any) => new Fund.Holding(e.name, e.symbol, e.weight)))
  }
  if (!_.isNil(entry.historicPrices)) {
    builder = builder.historicPrices(entry.historicPrices.map((e: any) => new Fund.HistoricPrice(e.date, e.price)))
  }
  return builder.build()
}
export async function upsertFunds (funds: any) {
  if (!funds.length) {
    log.info('No funds to upsert. Returning...')
    return
  }
  // count all funds
  const shardCounts = await (Promise as any).map(db.getFunds(), (fundDb: any) => fundDb.countDocuments())
  // find matching ids in shards
  const searchIds = funds.map((f: any) => f[idField]).filter((val: any) => val)
  const findOptions = {
    query: { _id: { $in: searchIds } },
    projection: { _id: 1 }
  }
  const shardedDocs = await (Promise as any).map(buildFindQuery(findOptions), (query: any) => query.toArray())
  const shardedIds = shardedDocs.map((docs: any) => new Set(docs.map((doc: any) => doc._id)))
  // partition funds into shards
  const bucketedFunds = shardedIds.map((shard: any) => <Fund[]>[])
  for (const fund of funds) {
    let shardIdx = shardedIds.findIndex((shard: any) => shard.has(fund[idField]))
    if (shardIdx === -1) {
      // assign to least occupied shard
      shardIdx = math.minIndex(shardCounts)
      shardCounts[shardIdx]++
    }
    bucketedFunds[shardIdx].push(fund)
  }
  const upsertOperation = (fund: any) => {
    const doc = fromFund(fund)
    const query = { _id: fund[idField] }
    const operation = { replaceOne: { filter: query, replacement: doc, upsert: true } }
    return operation
  }
  const bucketedOperations = bucketedFunds.map((bucket: any) => bucket.map(upsertOperation))
  try {
    // @ts-expect-error ts-migrate(7031) FIXME: Binding element 'fundDb' implicitly has an 'any' t... Remove this comment to see the full error message
    await (Promise as any).map(_.zip(db.getFunds(), bucketedOperations), ([fundDb, operations]) => {
      return operations.length ? fundDb.bulkWrite(operations) : []
    })
  } catch (err) {
    log.error('Failed to upsert funds: %j. Error: %s', funds, err.stack)
    return
  }
  log.info('Upserted funds: %j', bucketedFunds.map((funds: any, i: any) => `${JSON.stringify(funds.map((f: any) => f[idField]))} in shard ${i}`).join('; '))
}
/**
 *
 * @param options mongodb options
 * @param toPlainObject [optional] boolean - true: to plain object, false: to fund
 */

export async function listFunds (options: any, toPlainObject = false) {
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
  return docs.map(toPlainObject ? _.toPlainObject : toFund)
}

export function streamFunds (options: any, toPlainObject = false) {
  const res = new stream.PassThrough({
    objectMode: true
  });
  (Promise as any).each(buildFindQuery(options), async (query: any) => {
    const fundDbStream = query.transformStream({
      transform: toPlainObject ? _.toPlainObject : toFund
    })
    fundDbStream.pipe(res, { end: false })
    return new Promise((resolve, reject) => {
      fundDbStream.on('end', resolve)
      fundDbStream.on('error', reject)
    })
  }).then(() => {
    res.end()
  })
  return res
}

export async function deleteFunds (options: any) {
  const queryOpts = _.defaultTo(options.query, {})
  try {
    await (Promise as any).map(db.getFunds(), (fundDb: any) => fundDb.deleteMany(queryOpts))
  } catch (err) {
    log.error('Failed to delete funds. Error: %s', err.stack)
  }
}

export async function exportCsv (headerFields: any, options: any) {
  const funds = await listFunds(options, true)
  return csv.convert(funds, headerFields)
}

export async function search (text: any, projection: any, limit: any) {
  const options = {
    query: { $text: { $search: text } },
    projection: { ...projection, score: { $meta: 'textScore' } },
    sort: { score: { $meta: 'textScore' } },
    limit
  }
  return listFunds(options, true)
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
  return db.getFunds().map((fundDb: any) => fundDb.find(query, findOptions))
}
