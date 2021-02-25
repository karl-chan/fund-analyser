import * as FreeRealTime from '../../lib/stock/FreeRealTime'
import * as db from '../util/db'
import log from '../util/log'

export default class TokenDAO {
  static async getFreeRealTimeToken (): Promise<FreeRealTime.Token> {
    const query = { name: 'freeRealTime' }
    const doc = await db.getToken().findOne(query)
    return doc?.token
  }

  static async upsertFreeRealTimeToken (token: FreeRealTime.Token) {
    const query = { name: 'freeRealTime' }
    const doc = {
      name: 'freeRealTime',
      token
    }
    const res = await db.getToken().replaceOne(query, doc, { upsert: true })
    if (res.upsertedCount === 1) {
      log.info('Upserted free real time token: %j', token)
      return true
    }
    return false
  }
}
