import * as fs from 'fs/promises'
import log from '../../lib/util/log'
import * as TestReportDAO from '../../lib/db/TestReportDAO'

/**
 * Upload test report file to database
 * @returns {Promise.<void>}
 */
export default async function uploadTestReport (path: any) {
  const testReport = await fs.readFile(path, 'utf8')
  await TestReportDAO.upsertTestReport(testReport)
  log.info('Uploaded test report from path: %s', path)
}
