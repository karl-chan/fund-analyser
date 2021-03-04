import * as db from '../util/db'
import * as TestReportDAO from './TestReportDAO'

jest.setTimeout(30000) // 30 seconds

describe('TestReportDAO', function () {
  beforeAll(async () => {
    await db.init()
  })
  afterAll(async () => {
    await db.close()
  })
  test('isPassing should return true', async () => {
    const isPassing = await TestReportDAO.isPassing()
    expect(isPassing).toBeTrue()
  })

  test('getTestReport should return null or html', async () => {
    const testReport = await TestReportDAO.getTestReport()
    expect(testReport).toInclude('<html>')
  })
})
