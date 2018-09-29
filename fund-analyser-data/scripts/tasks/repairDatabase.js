module.exports = repairDatabase

const db = require('../../lib/util/db')
const Promise = require('bluebird')

/**
 * Reclaims unused disk space in database
 */
async function repairDatabase () {
    const {mainDb, fundDbs} = db.get()
    return Promise.map([mainDb, ...fundDbs], db => db.command({repairDatabase: 1}))
}
