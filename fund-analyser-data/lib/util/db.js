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
const uri = properties.get('db.mongo.uri')

const MongoClient = require('mongodb').MongoClient

let _client, _db

async function init () {
    _client = await MongoClient.connect(uri)
    _db = _client.db()
}

function get () {
    return _db
}

function getFunds () {
    return _db.collection('funds')
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
    await _client.close()
}
