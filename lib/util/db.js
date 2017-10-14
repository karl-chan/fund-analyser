module.exports = {
    init,
    get,
    getFunds,
    isRunning
};

const properties = require('./properties.js');
const log = require('./log.js');
const uri = properties.get('db.mongo.uri');

const moment = require('moment');
const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');

let _db;


async function init(callback) {
    _db = await MongoClient.connect(uri);
}

function get() {
    return _db;
}

function getFunds() {
    return get().collection('funds');
}

async function isRunning(bool) {
    const col = get().collection('is_running');
    if (_.isBoolean(bool)) { // required because bool may be false
        // setter
        log.info('Setting is running to: ' + bool);
        return col.replaceOne({}, {'is_running': bool}, {upsert: true});
    } else {
        // getter
        const doc = await col.findOne({});
        const isRunning = _.get(doc, 'is_running', false);
        log.info('Is another thread running: ' + isRunning);
        return isRunning;
    }
}


