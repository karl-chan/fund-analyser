module.exports = createIndex;

const async = require('async');
const db = require('../../lib/util/db.js');

/**
 * Create index on popular fields for sorting
 * @param callback
 */
function createIndex(callback) {
    async.each(['1D', '3D', '1W', '2W', '1M', '3M', '6M', '1Y', '3Y', '5Y'], (period, cb) => {
        const index = {};
        index[`returns.${period}`] = 1;
        db.getFunds().createIndex(index, cb);
    }, callback);
}