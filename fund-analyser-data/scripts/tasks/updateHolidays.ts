import { Promise } from 'bluebird'
import * as HolidayDAO from '../../lib/db/HolidayDAO'
import NYTimes from '../../lib/fund/NYTimes'
import log from '../../lib/util/log'
import * as _ from 'lodash'
/**
 * Update holidays for all stock exchanges
 * @returns {Promise.<void>}
 */
export default async function updateHolidays () {
  const nyTimes = new NYTimes()
  const exchangeTickers = await nyTimes.getExchangeTickers()
  const holidaysMap = _.fromPairs(await (Promise as any).map(exchangeTickers, async (exchange: any) => {
    const holidays = await nyTimes.getHolidaysForExchange(exchange)
    return [exchange, holidays]
  }))
  await HolidayDAO.upsertHolidays(holidaysMap)
  log.info('Upserted holidays for exchanges: %s', JSON.stringify(Object.keys(holidaysMap)))
}
