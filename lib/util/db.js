module.exports = {
    init,
    get
};

const properties = require('../util/properties.js');
const uri = properties.get('db.mongo.uri');
const MongoClient = require('mongodb').MongoClient;

let _db;


function init(callback) {
    MongoClient.connect(uri, function (err, db) {
        _db = db;
        callback(err, _db);
    });
}

function get() {
    return _db;
}

