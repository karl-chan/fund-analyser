module.exports = {
    init,
    get,
    getFunds,
    getCurrencies,
    getSessions,
    getUsers,
    close
}

const properties = require('./properties')
const uri = properties.get('db.mongo.uri.main')
const fundUris = JSON.parse(properties.get('db.mongo.uri.funds'))

const Promise = require('bluebird')
const MongoClient = require('mongodb').MongoClient

let _client, _db
let _fundClients, _fundDbs

async function init () {
    [_client, _fundClients] = await Promise.all([
        MongoClient.connect(uri),
        Promise.map(fundUris, MongoClient.connect)
    ])

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

function getCurrencies () {
    return _db.collection('currencies')
}

function getSessions () {
    return _db.collection('sessions')
}

function getUsers () {
    return _db.collection('users')
}

async function close () {
    await Promise.all([
        _client.close(),
        Promise.map(_fundClients, client => client.close())
    ])
}
