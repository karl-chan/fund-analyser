const db = require('../util/db')
const log = require('../util/log')
const _ = require('lodash')

/**
 * A SessionDAO entry is represented by
 * {
 *  sessionId: string,
 *  token?: {
 *    user: string,
 *    pass: string,
 *    memorableWord: string,
 *    name: string,
 *    expiry: Date,
 *    location: {
 *      city: string,
 *      region: string,
 *      country: string,
 *      ip: string
 *    }
 *  }
 * }
 */

function SessionDAO (entry) {
    _.assign(this, entry)
}

SessionDAO.serialise = function (data, sessionId) {
    const entry = { ...data, sessionId }
    return new SessionDAO(entry)
}

SessionDAO.deserialise = function (entry) {
    const { sessionId, ...data } = entry
    return { data, sessionId }
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
        const { data } = SessionDAO.deserialise(entry)
        return data
    }
    return null
}

SessionDAO.findSessionsForUser = async function (user) {
    if (!user) {
        return []
    }
    const query = { 'token.user': user }

    const sessions = await db.getSessions().find(query).toArray()
    log.debug('Retrieved sessions from database')
    return sessions
}

SessionDAO.deleteSession = async function (sessionId) {
    const query = { sessionId }

    await db.getSessions().deleteOne(query)
    log.debug('Deleted session from database')
}

SessionDAO.deleteExpiredSessions = async function () {
    const query = { 'token.expiry': { $lte: new Date() } }

    await db.getSessions().deleteMany(query)
    log.info('Deleted all expired sessions')
}
module.exports = SessionDAO
