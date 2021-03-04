import * as cheerio from 'cheerio'
import moment from 'moment'
import * as util from 'util'
import * as zlib from 'zlib'
import * as db from '../util/db'

const brotliCompress = util.promisify(zlib.brotliCompress)
const brotliDecompress = util.promisify(zlib.brotliDecompress)

export async function isPassing () {
  const doc = await db.getTestReport().findOne({}, { projection: { passed: 1, startTime: 1 } })
  return doc && doc.passed && moment().diff(doc.startTime, 'days') <= 1
}

export async function getTestReport () {
  const doc = await db.getTestReport().findOne({}, { projection: { compressedHtml: 1 } })
  return doc &&
        brotliDecompress(doc.compressedHtml.buffer)
          .then(buffer => buffer.toString())
}

export async function upsertTestReport (testReport: string) {
  const $ = cheerio.load(testReport)
  const summary = JSON.parse(JSON.parse($('#resData').text()))
  const startTime = moment(summary.startTime).toDate()
  const passed =
    summary.numFailedTests === 0 &&
    summary.numFailedTestSuites === 0

  const compressedHtml = await brotliCompress(testReport)
  const operations = [
    { deleteMany: { filter: {} } },
    { insertOne: { document: { compressedHtml, passed, startTime } } }
  ]
  await db.getTestReport().bulkWrite(operations)
}
