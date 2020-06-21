const db = require('../util/db')
const log = require('../util/log')
const _ = require('lodash')

// property keys
const FUND_WATCHLIST = 'fundWatchlist'
const CURRENCIES = 'currencies'
const SIMULATE_PARAMS = 'simulateParams'

/**
 * A UserDAO entry is represented by
 * {
 *  user: string,
 *  meta: {
 *    fundWatchlist: [string],
 *    currencies: [string],
 *    simulateParams: [SimulateParam]
 *  }
 * }
 */

function UserDAO (entry) {
    _.assign(this, entry)

    if (!this.meta) {
        this.meta = { [FUND_WATCHLIST]: [], [CURRENCIES]: [], simulateParams: [] }
    }
}

UserDAO.serialise = function (user, meta) {
    const entry = { user, meta }
    return new UserDAO(entry)
}

UserDAO.deserialise = function (entry) {
    const { user, meta } = entry
    return { user, meta }
}

UserDAO.createUserIfNotExists = async function (user) {
    const entry = UserDAO.serialise(user)
    const doc = _.toPlainObject(entry)
    const res = await db.getUsers().updateOne({ user }, { $setOnInsert: doc }, { upsert: true })
    if (res.upsertedCount === 1) {
        log.info(`Created user [${user}]`)
        return true
    }
    return false
}

UserDAO.listUsers = async function () {
    const docs = await db.getUsers().find().toArray()
    const users = docs.map(UserDAO.deserialise)
    return users
}

UserDAO.deleteUser = async function (user) {
    await db.getUsers().deleteOne({ user })
}

UserDAO.getFundWatchlist = async function (user) {
    return getProperty(user, FUND_WATCHLIST)
}

UserDAO.addToFundWatchlist = async function (user, isin) {
    return addToProperty(user, FUND_WATCHLIST, isin)
}

UserDAO.removeFromFundWatchlist = async function (user, isin) {
    return removeFromProperty(user, FUND_WATCHLIST, isin)
}

UserDAO.clearFundWatchlist = async function (user) {
    return clearProperty(user, FUND_WATCHLIST)
}

UserDAO.getCurrencies = async function (user) {
    return getProperty(user, CURRENCIES)
}

UserDAO.addToCurrencies = async function (user, currency) {
    return addToProperty(user, CURRENCIES, currency)
}

UserDAO.removeFromCurrencies = async function (user, currency) {
    return removeFromProperty(user, CURRENCIES, currency)
}

UserDAO.getSimulateParams = async function (user) {
    return getProperty(user, SIMULATE_PARAMS)
}

UserDAO.addToSimulateParams = async function (user, simulateParam) {
    return addToProperty(user, SIMULATE_PARAMS, simulateParam)
}

UserDAO.removeFromSimulateParams = async function (user, simulateParam) {
    return removeFromProperty(user, SIMULATE_PARAMS, simulateParam)
}

UserDAO.activateSimulateParam = async function (user, simulateParam) {
    const operations = [
        {
            updateMany: {
                filter: { user },
                update: { $unset: { 'meta.simulateParams.$[].active': '' } }
            }
        },
        {
            updateOne: {
                filter: { user, 'meta.simulateParams': simulateParam },
                update: { $set: { 'meta.simulateParams.$.active': true } }
            }
        }
    ]
    await db.getUsers().bulkWrite(operations)
    log.debug(`Activated [${user}]'s ${SIMULATE_PARAMS}: [${JSON.stringify(simulateParam)}]`)
}

UserDAO.deactivateAllSimulateParams = async function (user) {
    await db.getUsers().updateMany({ user }, { $unset: { 'meta.simulateParams.$[].active': '' } })
    log.debug(`Deactivated all [${user}]'s ${SIMULATE_PARAMS}`)
}

async function getProperty (user, property, fallbackValue = []) {
    const doc = await db.getUsers().findOne({ user }, { projection: { [`meta.${property}`]: 1 } })
    return doc ? doc.meta[property] : fallbackValue
}

async function addToProperty (user, property, value) {
    const oldValues = await getProperty(user, property)
    if (oldValues.some(v => _.isEqual(v, value))) {
        return false // no action required if already present
    }

    await db.getUsers().updateMany({ user }, { $push: { [`meta.${property}`]: value } })
    log.debug(`Added [${JSON.stringify(value)}] to [${user}]'s ${property}`)
    return true
}

async function removeFromProperty (user, property, value) {
    const res = await db.getUsers().findOneAndUpdate({ user }, { $pull: { [`meta.${property}`]: value } })
    log.debug(`Removed [${value}] from [${user}]'s ${property}`)

    return res.value.meta[property]
}

async function clearProperty (user, property) {
    await db.getUsers().updateMany({ user }, { $set: { [`meta.${property}`]: [] } })
    log.debug(`Cleared [${user}]'s ${property}`)
}

module.exports = UserDAO
