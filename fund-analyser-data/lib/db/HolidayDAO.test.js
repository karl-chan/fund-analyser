const HolidayDAO = require('./HolidayDAO')
const db = require('../util/db')

jest.setTimeout(30000) // 30 seconds

describe('HolidayDAO', function () {
    beforeAll(async () => {
        await db.init()
    })
    afterAll(async () => {
        await db.close()
    })
    test('listHolidays should return holidays for all stock exchanges', async () => {
        const allHolidays = await HolidayDAO.listHolidays()
        expect(allHolidays).toContainAllKeys(['ASX', 'PAR', 'FRA', 'HKG', 'LSE', 'MEX', 'MIL', 'NSQ', 'NSI', 'NYQ', 'SGO', 'SAO', 'SHH', 'TYO', 'TOR'])
        expect(Object.values(allHolidays)).toSatisfyAll(dates => Array.isArray(dates) && dates.length > 0 && dates.every(d => d instanceof Date))
    })
})
