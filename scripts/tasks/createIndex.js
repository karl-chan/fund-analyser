module.exports = createIndex;

const async = require('async');
const db = require('../../lib/util/db.js');

/**
 * Create index on popular fields for sorting
 * @param callback
 */
async function createIndex() {

    await new Promise((resolve, reject) => {
        async.each(['1D', '3D', '1W', '2W', '1M', '3M', '6M', '1Y', '3Y', '5Y'], (period, cb) => {
            const index = {};
            index[`returns.${period}`] = 1;
            db.getFunds().createIndex(index, {background: true}, cb);
        }, (err) => {
            err? reject(err): resolve()
        });
    });

    await db.getFunds().createIndex({asof: 1}, {background: true})
}