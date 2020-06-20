module.exports = {
    fromStock,
    toStock,
    upsertStocks,
    listStocks,
    streamStocks,
    deleteStocks,
    search
}

const db = require('../util/db')
const log = require('../util/log')
const math = require('../util/math')
const Stock = require('../stock/Stock')

const _ = require('lodash')
const Promise = require('bluebird')
const stream = require('stream')

const idField = 'symbol'

function fromStock (stock) {
    return {
        _id: stock[idField],
        ..._.toPlainObject(stock)
    }
}

function toStock (entry) {
    delete entry._id

    let builder = Stock.Builder(entry.isin)
    builder = _.isNil(entry.symbol) ? builder : builder.symbol(entry.symbol)
    builder = _.isNil(entry.name) ? builder : builder.name(entry.name)
    builder = _.isNil(entry.returns) ? builder : builder.returns(entry.returns)
    builder = _.isNil(entry.asof) ? builder : builder.asof(entry.asof)
    builder = _.isNil(entry.indicators) ? builder : builder.indicators(entry.indicators)
    builder = _.isNil(entry.realTimeDetails) ? builder : builder.realTimeDetails(entry.realTimeDetails)

    if (!_.isNil(entry.historicPrices)) {
        builder = builder.historicPrices(entry.historicPrices.map(
            e => new Stock.HistoricPrice(e.date, e.open, e.high, e.low, e.close, e.volume)
        ))
    }
    return builder.build()
}

async function upsertStocks (stocks) {
    if (!stocks.length) {
        log.info('No stocks to upsert. Returning...')
        return
    }

    // count all stocks
    const shardCounts = await Promise.map(db.getStocks(), stockDb => stockDb.countDocuments())

    // find matching ids in shards
    const searchIds = stocks.map(f => f[idField]).filter(val => val)
    const findOptions = {
        query: { _id: { $in: searchIds } },
        projection: { _id: 1 }
    }
    const shardedDocs = await Promise.map(buildFindQuery(findOptions), query => query.toArray())
    const shardedIds = shardedDocs.map(docs => new Set(docs.map(doc => doc._id)))

    // partition stocks into shards
    const bucketedStocks = shardedIds.map(shard => [])
    for (const stock of stocks) {
        let shardIdx = shardedIds.findIndex(shard => shard.has(stock[idField]))
        if (shardIdx === -1) {
            // assign to least occupied shard
            shardIdx = math.minIndex(shardCounts)
            shardCounts[shardIdx]++
        }
        bucketedStocks[shardIdx].push(stock)
    }

    const upsertOperation = stock => {
        const doc = fromStock(stock)
        const query = { _id: stock[idField] }
        const operation = { replaceOne: { filter: query, replacement: doc, upsert: true } }
        return operation
    }

    const bucketedOperations = bucketedStocks.map((bucket) => bucket.map(upsertOperation))
    try {
        await Promise.map(
            _.zip(db.getStocks(), bucketedOperations), ([stockDb, operations]) => {
                return operations.length ? stockDb.bulkWrite(operations) : []
            })
    } catch (err) {
        log.error('Failed to upsert stocks: %j. Error: %s', stocks, err.stack)
        return
    }
    log.info('Upserted stocks: %j', bucketedStocks.map(
        (stocks, i) => `${JSON.stringify(stocks.map(f => f[idField]))} in shard ${i}`).join('; '))
}

/**
 *
 * @param options mongodb options
 * @param toPlainObject [optional] boolean - true: to plain object, false: to stock
 */
async function listStocks (options, toPlainObject) {
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

function streamStocks (options, toPlainObject) {
    const res = stream.PassThrough({
        objectMode: true
    })
    Promise.each(buildFindQuery(options), async query => {
        const stockDbStream = query.transformStream({
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

async function deleteStocks (options) {
    const queryOpts = _.defaultTo(options.query, {})
    try {
        await Promise.map(db.getStocks(), stockDb => stockDb.deleteMany(queryOpts))
    } catch (err) {
        log.error('Failed to delete stocks. Error: %s', err.stack)
    }
}

async function search (text, projection, limit) {
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
const buildFindQuery = (options) => {
    const query = (options && options.query) || {}
    const findOptions = {
        projection: options && options.projection,
        sort: options && options.sort,
        limit: options && options.limit
    }
    return db.getStocks().map(stockDb => stockDb.find(query, findOptions))
}
