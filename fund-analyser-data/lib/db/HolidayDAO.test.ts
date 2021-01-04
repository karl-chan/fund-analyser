import * as HolidayDAO from './HolidayDAO'
import * as db from '../util/db'

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
    expect(Object.values(allHolidays)).toSatisfyAll((dates: any) => Array.isArray(dates) && dates.length > 0 && dates.every(d => d instanceof Date))
  })
})
