
const db = require('../util/db')
const cheerio = require('cheerio')
const util = require('util')
const zlib = require('zlib')
const brotliCompress = util.promisify(zlib.brotliCompress)
const brotliDecompress = util.promisify(zlib.brotliDecompress)

async function isPassing () {
    const doc = await db.getTestReport().findOne({}, { passed: 1 })
    return doc && doc.passed
}

async function getTestReport () {
    const doc = await db.getTestReport().findOne({}, { compressedHtml: 1 })
    return doc &&
        brotliDecompress(doc.compressedHtml.buffer)
            .then(buffer => buffer.toString())
}

async function upsertTestReport (testReport) {
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

module.exports = {
    isPassing,
    getTestReport,
    upsertTestReport
}
