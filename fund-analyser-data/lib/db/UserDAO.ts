import * as _ from 'lodash'
import { SimulateParam } from '../simulate/simulate'
import * as db from '../util/db'
import log from '../util/log'

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

interface Metadata {
    fundWatchlist: string[]
    currencies: string[]
    simulateParams: SimulateParam[]
}

interface Entry {
    user: string,
    meta: Metadata
}

export default class UserDAO {
  private static serialise (user: string, meta?: Metadata) {
    if (!meta) {
      meta = { [FUND_WATCHLIST]: [], [CURRENCIES]: [], simulateParams: [] }
    }
    return { user, meta }
  }

  private static deserialise (entry: any): Entry {
    const { user, meta } = entry
    return { user, meta }
  }

  static async createUserIfNotExists (user: string) {
    const entry = UserDAO.serialise(user)
    const res = await db.getUsers().updateOne({ user }, { $setOnInsert: entry }, { upsert: true })
    if (res.upsertedCount === 1) {
      log.info(`Created user [${user}]`)
      return true
    }
    return false
  }

  static async listUsers () {
    const docs = await db.getUsers().find().toArray()
    const users = docs.map(UserDAO.deserialise)
    return users
  }

  static async deleteUser (user: string) {
    await db.getUsers().deleteOne({ user })
  }

  static async getFundWatchlist (user: string) {
    return this.getProperty(user, FUND_WATCHLIST)
  }

  static async addToFundWatchlist (user: string, isin: string) {
    return this.addToProperty(user, FUND_WATCHLIST, isin)
  }

  static async removeFromFundWatchlist (user: string, isin: string) {
    return this.removeFromProperty(user, FUND_WATCHLIST, isin)
  }

  static async clearFundWatchlist (user: string) {
    return this.clearProperty(user, FUND_WATCHLIST)
  }

  static async getCurrencies (user: string) {
    return this.getProperty(user, CURRENCIES)
  }

  static async addToCurrencies (user: string, currency: any) {
    return this.addToProperty(user, CURRENCIES, currency)
  }

  static async removeFromCurrencies (user: string, currency: any) {
    return this.removeFromProperty(user, CURRENCIES, currency)
  }

  static async getSimulateParams (user: string) : Promise<SimulateParam[]> {
    return this.getProperty(user, SIMULATE_PARAMS)
  }

  static async addToSimulateParams (user: string, simulateParam: SimulateParam) {
    return this.addToProperty(user, SIMULATE_PARAMS, simulateParam)
  }

  static async removeFromSimulateParams (user: string, simulateParam: SimulateParam) {
    return this.removeFromProperty(user, SIMULATE_PARAMS, simulateParam)
  }

  static async activateSimulateParam (user: string, simulateParam: SimulateParam) {
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
    // @ts-ignore
    await db.getUsers().bulkWrite(operations)
    log.debug(`Activated [${user}]'s ${SIMULATE_PARAMS}: [${JSON.stringify(simulateParam)}]`)
  }

  static async deactivateAllSimulateParams (user: string) {
    await db.getUsers().updateMany({ user }, { $unset: { 'meta.simulateParams.$[].active': '' } })
    log.debug(`Deactivated all [${user}]'s ${SIMULATE_PARAMS}`)
  }

  static async getProperty (user: string, property: any, fallbackValue: any[] = []) {
    const doc = await db.getUsers().findOne({ user }, { projection: { [`meta.${property}`]: 1 } })
    return doc ? doc.meta[property] : fallbackValue
  }

  private static async addToProperty (user: string, property: any, value: any) {
    const oldValues = await this.getProperty(user, property)
    if (oldValues.some((v: any) => _.isEqual(v, value))) {
      return false // no action required if already present
    }

    await db.getUsers().updateMany({ user }, { $push: { [`meta.${property}`]: value } })
    log.debug(`Added [${JSON.stringify(value)}] to [${user}]'s ${property}`)
    return true
  }

  static async removeFromProperty (user: string, property: any, value: any) {
    const res = await db.getUsers().findOneAndUpdate({ user }, { $pull: { [`meta.${property}`]: value } })
    log.debug(`Removed [${value}] from [${user}]'s ${property}`)

    return res.value.meta[property]
  }

  static async clearProperty (user: string, property: any) {
    await db.getUsers().updateMany({ user }, { $set: { [`meta.${property}`]: [] } })
    log.debug(`Cleared [${user}]'s ${property}`)
  }
}
