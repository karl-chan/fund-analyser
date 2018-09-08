module.exports = repairDatabase

const db = require('../../lib/util/db')

/**
 * Reclaims unused disk space in database
 * @param callback
 */
async function repairDatabase () {
    return db.get().command({repairDatabase: 1})
}
