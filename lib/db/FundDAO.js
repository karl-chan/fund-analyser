const db = require('../util/db.js');
const log = require('../util/log.js');
const csv = require('../util/csv.js');
const Fund = require('../fund/Fund.js');

const fs = require('fs');
const _ = require('lodash');
const json2csv = require('json2csv');
const stream = require('stream');

function FundDAO(fund) {
    _.assign(this, fund);
}

FundDAO.fromFund = function (fund) {
    const entry = _.cloneDeep(fund);
    entry._id = fund.isin;
    return new FundDAO(entry);
};

FundDAO.toFund = function (entry) {
    let builder = Fund.Builder(entry.isin);

    builder = _.isNil(entry.name) ? builder : builder.name(entry.name);
    builder = _.isNil(entry.type) ? builder : builder.type(entry.type);
    builder = _.isNil(entry.shareClass) ? builder : builder.shareClass(entry.shareClass);
    builder = _.isNil(entry.frequency) ? builder : builder.frequency(entry.frequency);
    builder = _.isNil(entry.ocf) ? builder : builder.ocf(entry.ocf);
    builder = _.isNil(entry.amc) ? builder : builder.amc(entry.amc);
    builder = _.isNil(entry.entryCharge) ? builder : builder.entryCharge(entry.entryCharge);
    builder = _.isNil(entry.exitCharge) ? builder : builder.exitCharge(entry.exitCharge);
    builder = _.isNil(entry.returns) ? builder : builder.returns(entry.returns);
    if (!_.isNil(entry.holdings)) {
        builder = builder.holdings(entry.holdings.map(
            e => new Fund.Holding(e.name, e.symbol, e.weight)
        ));
    }
    if (!_.isNil(entry.historicPrices)) {
        builder = builder.historicPrices(entry.historicPrices.map(
            e => new Fund.HistoricPrice(e.date, e.price)
        ));
    }
    return builder.build();
};

FundDAO.upsertFund = function (fund, callback) {
    const entry = FundDAO.fromFund(fund);
    const query = {_id: entry._id};
    const doc = _.toPlainObject(entry);
    const collection = db.get().collection('funds');

    if (_.isEmpty(fund.name)) {
        // delete if fund record is obsolete
        collection.deleteOne(query, (err, response) => {
            if (err) {
                return callback(err);
            }
            log.debug('Deleted obsolete fund in database: %j. Response: %j', fund, response);
            return callback();
        });
    } else {
        collection.updateOne(query, doc, {upsert: true}, (err, response) => {
            if (err) {
                return callback(err);
            }
            log.debug('Upserted fund in database: %j. Response: %j', fund, response);
            return callback();
        });
    }
};

/**
 *
 * @param options mongodb options
 * @param toPlainObject [optional] boolean - true: to plain object, false: to fund
 * @param callback
 */
FundDAO.listFunds = function (options, toPlainObject, callback) {
    // shift args if needed
    if (!callback) {
        callback = toPlainObject;
        toPlainObject = false;
    }

    let query = buildQuery(options);
    query.toArray((err, docs) => {
        const transform = toPlainObject ? _.toPlainObject : FundDAO.toFund;
        return callback(err, _.map(docs, transform));
    });
};

FundDAO.streamFunds = function (options) {
    const dbStream = buildQuery(options).stream();
    const fundTransform = new stream.Transform({
        objectMode: true,
        transform(doc, encoding, callback) {
            const fund = FundDAO.toFund(doc);
            return callback(null, fund);
        }
    });
    const fundStream = dbStream.pipe(fundTransform);
    dbStream.on('error', (err) => {
        fundStream.emit('error', err);
    });
    return fundStream;
};

FundDAO.exportCsv = function (savePath, options, headerFields, callback) {
    FundDAO.listFunds(options, true, (err, funds) => {
        if (err) {
            return callback(err);
        }
        const csvFile = json2csv({
            data: funds,
            fields: csv.formatFields(headerFields)
        });
        fs.writeFile(savePath, csvFile, callback);
    });
};

FundDAO.streamCsv = function (savepath, options, headerFields) {
    const fundStream = FundDAO.streamFunds(options);
    const parserStream = csv.streamParser(headerFields);
    const csvStream = fundStream.pipe(parserStream);
    fundStream.on('error', (err) => {
        csvStream.emit('error', err);
    });
    return csvStream;
};

FundDAO.prototype.equals = function (o) {
    if (!(o instanceof FundDAO)) {
        return false;
    }
    const omitField = '_id';
    const selfCopy = _.cloneDeep(this);
    const otherCopy = _.cloneDeep(o);

    selfCopy.holdings = omitDeep(selfCopy.holdings, omitField);
    otherCopy.holdings = omitDeep(otherCopy.holdings, omitField);
    selfCopy.historicPrices = omitDeep(selfCopy.historicPrices, omitField);
    otherCopy.historicPrices = omitDeep(otherCopy.historicPrices, omitField);

    return _.isEqual(selfCopy, otherCopy);
};

function omitDeep(arr, omitField) {
    const copy = _.clone(arr);
    for (let i = 0; i < arr.length; i++) {
        copy[i] = _.omit(arr[i], omitField);
    }
    return copy;
}

const buildQuery = (options) => {
    const type = options.type;
    delete options.type;
    switch (type) {
        case 'aggregate':
            return buildAggregateQuery(options.pipeline);
        default:
            return buildFindQuery(options);
    }
};

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
    const queryOpts = _.defaultTo(options.query, {});
    const projectOpts = _.defaultTo(options.project, {});
    const sortOpts = options.sort;
    const skipOpts = options.skip;
    const limitOpts = options.limit;

    let query = db.get().collection('funds').find(queryOpts);
    query = projectOpts ? query.project(projectOpts) : query;
    query = sortOpts ? query.sort(sortOpts) : query;
    query = skipOpts ? query.skip(skipOpts) : query;
    query = limitOpts ? query.limit(limitOpts) : query;
    return query;
};

/**
 * Executes mongodb aggregate query
 * @param pipeline array
 */
const buildAggregateQuery = (pipeline) => {
    return db.get().collection('funds').aggregate(pipeline, {allowDiskUse: true});
};

module.exports = FundDAO;