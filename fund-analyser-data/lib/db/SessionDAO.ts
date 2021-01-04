import * as db from '../util/db'
import log from '../util/log'
import * as _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'

const BACKGROUND_SESSION_USER_AGENT = 'Background Session'

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

interface Entry {
   sessionId: string,
   token?: {
     user: string,
     pass: string,
     memorableWord: string,
     name: string,
     expiry: Date,
     location: {
       city: string,
       region: string,
       country: string,
       ip: string
     }
   }
}

export default class SessionDAO {
  private static serialise (token: any, sessionId: any): Entry {
    return { ...token, sessionId }
  }

  private static deserialise (entry: any):Entry {
    const { sessionId, ...token } = entry
    return { token, sessionId }
  }

  static async upsertSession (data: any, sessionId: any) {
    const entry = SessionDAO.serialise(data, sessionId)
    const query = { sessionId }
    const doc = _.toPlainObject(entry)

    await db.getSessions().replaceOne(query, doc, { upsert: true })
    log.debug('Upserted session into database')
  }

  // Long lived background session for trading bot
  static async upsertBackgroundSession (token: any) {
    const longLivedExpiry = new Date(9999, 0, 1)
    const doc = {
      token: {
        ...token,
        expiry: longLivedExpiry,
        userAgent: BACKGROUND_SESSION_USER_AGENT
      },
      sessionId: uuidv4()
    }
    const query = { 'token.user': token.user, 'token.userAgent': BACKGROUND_SESSION_USER_AGENT }
    await db.getSessions().updateOne(query, { $setOnInsert: doc }, { upsert: true })
    log.debug(`Upserted background session for user: ${token.user}`)
  }

  static async findSession (sessionId: any) {
    const query = { sessionId }

    const entry = await db.getSessions().findOne(query)
    log.debug('Retrieved session from database')
    if (entry) {
      const { token } = SessionDAO.deserialise(entry)
      return token
    }
    return null
  }

  static async findSessionsForUser (user: any) {
    if (!user) {
      return []
    }
    const query = { 'token.user': user }

    const sessions = await db.getSessions().find(query).toArray()
    log.debug('Retrieved sessions from database')
    return sessions
  }

  static async deleteSession (sessionId: any) {
    const query = { sessionId }

    await db.getSessions().deleteOne(query)
    log.debug('Deleted session from database')
  }

  static async deleteBackgroundSession (user: any) {
    const query = { 'token.user': user, 'token.userAgent': BACKGROUND_SESSION_USER_AGENT }

    await db.getSessions().deleteMany(query)
    log.debug(`Deleted all background sessions for user: ${user}`)
  }

  static async deleteExpiredSessions () {
    const query = { 'token.expiry': { $lte: new Date() } }

    await db.getSessions().deleteMany(query)
    log.info('Deleted all expired sessions')
  }
}
