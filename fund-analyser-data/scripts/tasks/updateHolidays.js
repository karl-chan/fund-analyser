module.exports = updateHolidays

const HolidayDAO = require('../../lib/db/HolidayDAO')
const NYTimes = require('../../lib/fund/NYTimes')
const log = require('../../lib/util/log')

const _ = require('lodash')
const Promise = require('bluebird')

/**
 * Update holidays for all stock exchanges
 * @returns {Promise.<void>}
 */
async function updateHolidays () {
    const nyTimes = new NYTimes()
    const exchangeTickers = await nyTimes.getExchangeTickers()
    const holidaysMap = _.fromPairs(await Promise.map(exchangeTickers, async exchange => {
        const holidays = await nyTimes.getHolidaysForExchange(exchange)
        return [exchange, holidays]
    }))
    await HolidayDAO.upsertHolidays(holidaysMap)
    log.info('Upserted holidays for exchanges: %s', JSON.stringify(Object.keys(holidaysMap)))
};
