// writes to tmp storage
module.exports = {
    read,
    write,
    clear
}

const APP_FOLDER = 'fund-analyser' // put everything in /tmp/fund-analyser

const os = require('os')
const fs = require('fs-extra')
const path = require('path')
const moment = require('moment')
const tmp = path.join(os.tmpdir(), APP_FOLDER)

/**
 * Read object from /tmp/<key> file. Throws error if doesn't exist or expired.
 * @param {string} key
 */
async function read (key) {
    const location = path.join(tmp, key)
    const { expiry, object } = await fs.readJson(location)
    if (expiry < moment().unix()) {
        throw new Error(`Key already expired: ${key} at: ${expiry}`)
    }
    return object
}

/**
 * Write object into /tmp/<key> file, persisting for expiry seconds
 * @param {string} key
 */
async function write (key, object, expirySeconds) {
    const location = path.join(tmp, key)
    const expiry = moment().add(expirySeconds, 'seconds').unix()
    return fs.outputJson(location, { expiry, object })
}

/**
 * Clears everything in /tmp
 */
async function clear () {
    return fs.emptydir(tmp)
}
