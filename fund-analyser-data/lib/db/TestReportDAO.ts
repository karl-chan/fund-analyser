import * as cheerio from 'cheerio'
import * as db from '../util/db'
import * as util from 'util'
import * as zlib from 'zlib'
const brotliCompress = util.promisify(zlib.brotliCompress)
const brotliDecompress = util.promisify(zlib.brotliDecompress)

export async function isPassing () {
  const doc = await db.getTestReport().findOne({}, { passed: 1 })
  return doc && doc.passed
}

export async function getTestReport () {
  const doc = await db.getTestReport().findOne({}, { compressedHtml: 1 })
  return doc &&
        brotliDecompress(doc.compressedHtml.buffer)
          .then((buffer: any) => buffer.toString())
}

export async function upsertTestReport (testReport: any) {
  const $ = cheerio.load(testReport)
  const summary = JSON.parse(JSON.parse($('#resData').text()))
  const passed = summary.numFailedTests === 0 && summary.numFailedTestSuites === 0

  const compressedHtml = await brotliCompress(testReport)
  const operations = [
    { deleteMany: { filter: {} } },
    { insertOne: { document: { compressedHtml, passed } } }
  ]
  await db.getTestReport().bulkWrite(operations)
}
