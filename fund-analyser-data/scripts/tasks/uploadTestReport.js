module.exports = uploadTestReport

const fs = require('fs').promises
const log = require('../../lib/util/log')
const TestReportDAO = require('../../lib/db/TestReportDAO')

/**
 * Upload test report file to database
 * @returns {Promise.<void>}
 */
async function uploadTestReport (path) {
    const testReport = await fs.readFile(path, 'utf8')
    await TestReportDAO.upsertTestReport(testReport)
    log.info('Uploaded test report from path: %s', path)
}
