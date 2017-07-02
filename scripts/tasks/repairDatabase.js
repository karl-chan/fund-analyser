module.exports = repairDatabase;

const db = require('../../lib/util/db.js');

/**
 * Reclaims unused disk space in database
 * @param callback
 */
function repairDatabase(callback) {
    db.get().command({repairDatabase: 1}, callback);
}