module.exports = {
    fromFund,
    toFund,
    upsertFund,
    upsertFunds,
    listFunds,
    streamFunds,
    exportCsv,
    streamCsv
}

const db = require('../util/db')
const log = require('../util/log')
const csv = require('../util/csv')
const Fund = require('../fund/Fund')

const _ = require('lodash')
const stream = require('stream')

function fromFund (fund) {
    return _.toPlainObject(fund)
}

function toFund (entry) {
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
    builder = _.isNil(entry.percentiles) ? builder : builder.percentiles(entry.percentiles)
    builder = _.isNil(entry.asof) ? builder : builder.asof(entry.asof)
    builder = _.isNil(entry.indicators) ? builder : builder.indicators(entry.indicators)

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

function upsertFund (fund, callback) {
    const query = { sedol: fund.sedol }
    const doc = fromFund(fund)
    db.getFunds().replaceOne(query, doc, { upsert: true }, (err, response) => {
        if (err) {
            return callback(err)
        }
        log.debug('Upserted fund in database: %j. Response: %j', fund, response)
        return callback()
    })
}

async function upsertFunds (funds) {
    const operations = _.map(funds, (fund) => {
        const entry = fromFund(fund)
        const query = { sedol: entry.sedol }
        const doc = _.toPlainObject(entry)
        const operation = { replaceOne: { filter: query, replacement: doc, upsert: true } }
        return operation
    })
    if (!operations.length) {
        log.info('No funds to upsert. Returning...')
        return
    }
    try {
        await db.getFunds().bulkWrite(operations)
    } catch (err) {
        log.error('Failed to upsert funds')
        log.error(err)
    }
    log.info(`Upserted funds: %j`, funds)
}

/**
 *
 * @param options mongodb options
 * @param toPlainObject [optional] boolean - true: to plain object, false: to fund
 * @param callback
 */
function listFunds (options, toPlainObject, callback) {
    // shift args if needed
    if (!callback) {
        callback = toPlainObject
        toPlainObject = false
    }

    let query = buildQuery(options)
    query.toArray((err, docs) => {
        const transform = toPlainObject ? _.toPlainObject : toFund
        return callback(err, _.map(docs, transform))
    })
}

function streamFunds (options) {
    const dbStream = buildQuery(options).stream()
    const fundTransform = new stream.Transform({
        objectMode: true,
        transform (doc, encoding, callback) {
            const fund = toFund(doc)
            return callback(null, fund)
        }
    })
    const fundStream = dbStream.pipe(fundTransform)
    dbStream.on('error', (err) => {
        fundStream.emit('error', err)
    })
    return fundStream
}

function exportCsv (headerFields, options, callback) {
    listFunds(options, true, (err, funds) => {
        if (err) {
            return callback(err)
        }
        callback(null, csv.convert(funds, headerFields))
    })
}

function streamCsv (headerFields, options) {
    const fundStream = streamFunds(options)
    const parserStream = csv.streamParser(headerFields)
    const csvStream = fundStream.pipe(parserStream)
    fundStream.on('error', (err) => {
        csvStream.emit('error', err)
    })
    return csvStream
}

const buildQuery = (options) => {
    const type = options.type
    delete options.type
    switch (type) {
    case 'aggregate':
        return buildAggregateQuery(options.pipeline)
    default:
        return buildFindQuery(options)
    }
}

/**
 * Executes mongodb find query
 * @param options {
 *  query: obj,
 *  project: obj,
 *  sort: int,
 *  limit: int
 *  }
 */
const buildFindQuery = (options) => {
    const queryOpts = _.defaultTo(options.query, {})
    const projectOpts = _.defaultTo(options.project, {})
    const sortOpts = options.sort
    const skipOpts = options.skip
    const limitOpts = options.limit

    let query = db.getFunds().find(queryOpts)
    query = projectOpts ? query.project(projectOpts) : query
    query = sortOpts ? query.sort(sortOpts) : query
    query = skipOpts ? query.skip(skipOpts) : query
    query = limitOpts ? query.limit(limitOpts) : query
    return query
}

/**
 * Executes mongodb aggregate query
 * @param pipeline array
 */
const buildAggregateQuery = (pipeline) => {
    return db.getFunds().aggregate(pipeline, { allowDiskUse: true })
}
