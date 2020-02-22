module.exports = {
    init,
    get,
    getFunds,
    getSimilarFunds,
    getCurrencies,
    getSessions,
    getUsers,
    getHolidays,
    close
}

const properties = require('./properties')
const uri = properties.get('db.mongo.uri.main')
const fundUris = properties.get('db.mongo.uri.funds')

const Promise = require('bluebird')
const MongoClient = require('mongodb').MongoClient

let _client, _db
let _fundClients, _fundDbs

async function init () {
    const opts = { useNewUrlParser: true, useUnifiedTopology: true }
    ;([_client, _fundClients] = await Promise.all([
        MongoClient.connect(uri, opts),
        Promise.map(fundUris, fundUri => MongoClient.connect(fundUri, opts))
    ]))

    _db = _client.db()
    _fundDbs = _fundClients.map(client => client.db())
}

function get () {
    return {
        mainClient: _client,
        mainDb: _db,
        fundClients: _fundClients,
        fundDbs: _fundDbs
    }
}

function getFunds () {
    return _fundDbs.map(db => db.collection('funds'))
}

function getSimilarFunds () {
    return _db.collection('similarfunds')
}

function getCurrencies () {
    return _db.collection('currencies')
}

function getSessions () {
    return _db.collection('sessions')
}

function getUsers () {
    return _db.collection('users')
}

function getHolidays () {
    return _db.collection('holidays')
}

async function close () {
    await Promise.all([
        _client.close(),
        Promise.map(_fundClients, client => client.close())
    ])
}
