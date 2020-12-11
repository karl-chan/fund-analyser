module.exports = {
    init,
    get,
    getFunds,
    getStocks,
    getSimilarFunds,
    getCurrencies,
    getSessions,
    getUsers,
    getHolidays,
    getTestReport,
    close
}

const log = require('./log')
const properties = require('./properties')
const uri = properties.get('db.mongo.uri.main')
const fundUris = properties.get('db.mongo.uri.funds')
const stockUris = properties.get('db.mongo.uri.stocks')

const Promise = require('bluebird')
const MongoClient = require('mongodb').MongoClient

let _client, _db
let _fundClients, _fundDbs
let _stockClients, _stockDbs

async function init () {
    const opts = { useNewUrlParser: true, useUnifiedTopology: true }
    ;([_client, _fundClients, _stockClients] = await Promise.all([
        connectOrFail(uri, opts),
        Promise.map(fundUris, fundUri => connectOrFail(fundUri, opts)),
        Promise.map(stockUris, stockUri => connectOrFail(stockUri, opts))
    ]))

    _db = _client.db()
    _fundDbs = _fundClients.map(client => client.db())
    _stockDbs = _stockClients.map(client => client.db())
}

function get () {
    return {
        mainClient: _client,
        mainDb: _db,
        fundClients: _fundClients,
        fundDbs: _fundDbs,
        stockClients: _stockClients,
        stockDbs: _stockDbs
    }
}

function getFunds () {
    return _fundDbs.map(db => db.collection('funds'))
}

function getStocks () {
    return _stockDbs.map(db => db.collection('stocks'))
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

function getTestReport () {
    return _db.collection('testreport')
}

async function connectOrFail (uri, opts) {
    return MongoClient.connect(uri, opts)
        .catch(err => {
            log.error(`Failed to connect to uri: ${uri}`)
            throw err
        })
}

async function close () {
    await Promise.all([
        _client.close(),
        Promise.map(_fundClients, client => client.close()),
        Promise.map(_stockClients, client => client.close())
    ])
}
