const TestReportDAO = require('./TestReportDAO')
const db = require('../util/db')

jest.setTimeout(30000) // 30 seconds

describe('TestReportDAO', function () {
    beforeAll(async () => {
        await db.init()
    })
    afterAll(async () => {
        await db.close()
    })
    test('isPassing should return boolean', async () => {
        const isPassing = await TestReportDAO.isPassing()
        expect(isPassing).toBeBoolean()
    })

    test('getTestReport should return null or html', async () => {
        const testReport = await TestReportDAO.getTestReport()
        expect(testReport).toInclude('<html>')
    })
})
