module.exports = {
    init,
    get,
    getFunds,
    lastActive
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

async function lastActive(date) {
    const col = get().collection('last_active');
    if (date) {
        // setter
        log.info('Setting last active to: ' + date);
        return col.replaceOne({}, {'last_active': date}, {upsert: true});
    } else {
        // getter
        const doc = await col.findOne({});
        const lastActive = _.get(doc, 'last_active', new Date(0)); // default to 1970 (never)
        log.info('Last active: ' + lastActive);
        return lastActive;
    }
}


