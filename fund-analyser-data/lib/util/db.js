module.exports = {
    init,
    get,
    getFunds,
    getSessions
}

const properties = require('./properties.js')
const uri = properties.get('db.mongo.uri')

const MongoClient = require('mongodb').MongoClient

let _db

async function init () {
    const client = await MongoClient.connect(uri)
    _db = client.db()
}

function get () {
    return _db
}

function getFunds () {
    return _db.collection('funds')
}

function getSessions () {
    return _db.collection('sessions')
}
