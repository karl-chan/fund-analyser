
import * as db from '../util/db'

import * as _ from 'lodash'

/**
 * List holidays for all stock exchanges.
 * @return js object, e.g. {
 *      "NSE": [new Date(2018, 0, 1), ...],
 *      "TYO": [new Date(2018, 0, 1), ...],
 *      ...
 *  }
 */
export async function listHolidays () {
  const allHolidays = await db.getHolidays().find().toArray()
  return _.fromPairs(allHolidays.map((e: any) => [e.name, e.dates]))
}

/**
 * Upserts holidays map into database. The holidays map should be of the format:
 * {
 *      "NSE": [new Date(2018, 0, 1), ...],
 *      "TYO": [new Date(2018, 0, 1), ...],
 *      ...
 *  }
 * @param {*} holidaysMap
 */
export async function upsertHolidays (holidaysMap: any) {
  const operations = Object.entries(holidaysMap).map(([exchangeTicker, holidayDates]) => {
    return {
      replaceOne: {
        filter: {
          name: exchangeTicker
        },
        replacement: {
          name: exchangeTicker,
          dates: holidayDates
        },
        upsert: true
      }
    }
  })
  const res = await db.getHolidays().bulkWrite(operations)
  return res
}
