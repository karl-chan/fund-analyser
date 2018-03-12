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


async function init() {
    const client = await MongoClient.connect(uri);
    _db = client.db();
}

function get() {
    return _db;
}

function getFunds() {
    return _db.collection('funds');
}

