const db = require('../util/db.js')
const log = require('../util/log.js')
const _ = require('lodash')

/**
 * A UserDAO entry is represented by
 * {
 *  user: string,
 *  meta: {
 *    watchlist: [string]
 *  }
 * }
 */

function UserDAO (entry) {
    _.assign(this, entry)

    if (!this.meta) {
        this.meta = {watchlist: []}
    }
}

UserDAO.serialise = function (user, meta) {
    const entry = {user, meta}
    return new UserDAO(entry)
}

UserDAO.deserialise = function (entry) {
    const {user, meta} = entry
    return {user, meta}
}

UserDAO.createUserIfNotExists = async function (user) {
    const entry = UserDAO.serialise(user)
    const doc = _.toPlainObject(entry)
    const res = await db.getUsers().updateOne({user}, {$setOnInsert: doc}, {upsert: true})
    if (res.upsertedCount === 1) {
        log.info(`Created user [${user}]`)
        return true
    }
    return false
}

UserDAO.deleteUser = async function (user) {
    await db.getUsers().deleteOne({user})
}

UserDAO.getWatchlist = async function (user) {
    const {meta: {watchlist = []}} = await db.getUsers().findOne({user}, {projection: {'meta.watchlist': 1}})
    return watchlist
}

UserDAO.addToWatchlist = async function (user, isin) {
    const oldWatchlist = await this.getWatchlist(user)
    if (oldWatchlist.includes(isin)) {
        return false // no action required if already in watchlist
    }

    await db.getUsers().update({user}, {$push: {'meta.watchlist': isin}})
    log.debug(`Added [${isin}] to [${user}]'s watchlist`)
    return true
}

UserDAO.removeFromWatchlist = async function (user, isin) {
    const res = await db.getUsers().findOneAndUpdate({user}, {$pull: {'meta.watchlist': isin}})
    log.debug(`Removed [${isin}] from [${user}]'s watchlist`)

    return res.value.meta.watchlist
}

UserDAO.clearWatchlist = async function (user) {
    await db.getUsers().update({user}, {$set: {'meta.watchlist': []}})
    log.debug(`Cleared [${user}]'s watchlist`)
}

module.exports = UserDAO
