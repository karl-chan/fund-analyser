const db = require('../util/db.js')
const log = require('../util/log.js')
const _ = require('lodash')

/**
 * A SessionDAO entry is represented by
 * {
 *  "sessionId": string,
 *   ... other key value (string) pairs
 * }
 */

function SessionDAO (entry) {
    _.assign(this, entry)
}

SessionDAO.serialise = function (data, sessionId) {
    const entry = {...data, sessionId}
    return new SessionDAO(entry)
}

SessionDAO.deserialise = function (entry) {
    const {sessionId, ...data} = entry
    return {data, sessionId}
}

SessionDAO.upsertSession = async function (data, sessionId) {
    const entry = SessionDAO.serialise(data, sessionId)
    const query = { sessionId }
    const doc = _.toPlainObject(entry)

    await db.getSessions().replaceOne(query, doc, { upsert: true })
    log.debug('Upserted session into database')
}

SessionDAO.findSession = async function (sessionId) {
    const query = { sessionId }

    const entry = await db.getSessions().findOne(query)
    log.debug('Retrieved session from database')
    if (entry) {
        const {data} = SessionDAO.deserialise(entry)
        return data
    }
    return null
}

SessionDAO.deleteSession = async function (sessionId) {
    const query = { sessionId }

    await db.getSessions().deleteOne(query)
    log.debug('Deleted session from database')
}

module.exports = SessionDAO
