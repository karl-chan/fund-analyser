module.exports = {
    fromFund,
    toFund,
    upsertFunds,
    listFunds,
    streamFunds,
    deleteFunds,
    exportCsv,
    search
}

const db = require('../util/db')
const log = require('../util/log')
const csv = require('../util/csv')
const math = require('../util/math')
const Fund = require('../fund/Fund')

const _ = require('lodash')
const Promise = require('bluebird')
const stream = require('stream')

const idField = 'sedol'

function fromFund (fund) {
    return {
        _id: fund[idField],
        ..._.toPlainObject(fund)
    }
}

function toFund (entry) {
    delete entry._id

    let builder = Fund.Builder(entry.isin)
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
        builder = builder.holdings(entry.holdings.map(
            e => new Fund.Holding(e.name, e.symbol, e.weight)
        ))
    }
    if (!_.isNil(entry.historicPrices)) {
        builder = builder.historicPrices(entry.historicPrices.map(
            e => new Fund.HistoricPrice(e.date, e.price)
        ))
    }
    return builder.build()
}

async function upsertFunds (funds) {
    if (!funds.length) {
        log.info('No funds to upsert. Returning...')
        return
    }

    // count all funds
    const shardCounts = await Promise.map(db.getFunds(), fundDb => fundDb.countDocuments())

    // find matching ids in shards
    const searchIds = funds.map(f => f[idField]).filter(val => val)
    const findOptions = {
        query: { _id: { $in: searchIds } },
        projection: { _id: 1 }
    }
    const shardedDocs = await Promise.map(buildFindQuery(findOptions), query => query.toArray())
    const shardedIds = shardedDocs.map(docs => new Set(docs.map(doc => doc._id)))

    // partition funds into shards
    const bucketedFunds = shardedIds.map(shard => [])
    for (const fund of funds) {
        let shardIdx = shardedIds.findIndex(shard => shard.has(fund[idField]))
        if (shardIdx === -1) {
            // assign to least occupied shard
            shardIdx = math.minIndex(shardCounts)
            shardCounts[shardIdx]++
        }
        bucketedFunds[shardIdx].push(fund)
    }

    const upsertOperation = fund => {
        const doc = fromFund(fund)
        const query = { _id: fund[idField] }
        const operation = { replaceOne: { filter: query, replacement: doc, upsert: true } }
        return operation
    }

    const bucketedOperations = bucketedFunds.map((bucket) => bucket.map(upsertOperation))
    try {
        await Promise.map(
            _.zip(db.getFunds(), bucketedOperations), ([fundDb, operations]) => {
                return operations.length ? fundDb.bulkWrite(operations) : []
            })
    } catch (err) {
        log.error('Failed to upsert funds: %j. Error: %s', funds, err.stack)
        return
    }
    log.info('Upserted funds: %j', bucketedFunds.map(
        (funds, i) => `${JSON.stringify(funds.map(f => f[idField]))} in shard ${i}`).join('; '))
}

/**
 *
 * @param options mongodb options
 * @param toPlainObject [optional] boolean - true: to plain object, false: to fund
 */
async function listFunds (options, toPlainObject) {
    const shardedDocs = await Promise.map(buildFindQuery(options), query => query.toArray())
    let docs = _.flatten(shardedDocs)

    // need postprocessing because we are merging from different databases
    if (options && options.sort) {
        docs = _.orderBy(docs, Object.keys(options.sort), Object.values(options.sort).map(dir => dir === -1 || dir.$meta === 'textScore' ? 'desc' : 'asc'))
    }
    if (options && options.limit) {
        docs = docs.slice(0, options.limit)
    }
    return docs.map(toPlainObject ? _.toPlainObject : toFund)
}

function streamFunds (options, toPlainObject) {
    const res = stream.PassThrough({
        objectMode: true
    })
    Promise.each(buildFindQuery(options), async query => {
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

async function deleteFunds (options) {
    const queryOpts = _.defaultTo(options.query, {})
    try {
        await Promise.map(db.getFunds(), fundDb => fundDb.deleteMany(queryOpts))
    } catch (err) {
        log.error('Failed to delete funds. Error: %s', err.stack)
    }
}

async function exportCsv (headerFields, options) {
    const funds = await listFunds(options, true)
    return csv.convert(funds, headerFields)
}

async function search (text, projection, limit) {
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
const buildFindQuery = (options) => {
    const query = (options && options.query) || {}
    const findOptions = {
        projection: options && options.projection,
        sort: options && options.sort,
        limit: options && options.limit
    }
    return db.getFunds().map(fundDb => fundDb.find(query, findOptions))
}
