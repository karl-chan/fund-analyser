module.exports = {
    init,
    get,
    getFunds
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

