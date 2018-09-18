module.exports = updateFunds

const FundFactory = require('../../lib/fund/FundFactory')
const FundDAO = require('../../lib/db/FundDAO')
const streamWrapper = require('../../lib/util/streamWrapper')
const db = require('../../lib/util/db')
const log = require('../../lib/util/log')

const moment = require('moment')
const _ = require('lodash')
const Promise = require('bluebird')

/**
 * Update funds that need to be updated based on asof time
 * @returns {Promise.<void>}
 */
async function updateFunds () {
    const today = moment().utc().startOf('day').toDate()

    const fundsToUpdate = await new Promise((resolve, reject) => {
        FundDAO.listFunds({
            query: {$or: [{asof: {$eq: null}}, {asof: {$lt: today}}]},
            project: {sedol: 1}
        }, (err, funds) => {
            err ? reject(err) : resolve(funds)
        })
    })
    const sedols = _.map(fundsToUpdate, f => f.sedol)
    log.info('Sedols to update: %s', JSON.stringify(sedols))

    const fundStream = new FundFactory().streamFundsFromSedols(sedols)
    const fundValidFilter = streamWrapper.asFilter(isFundValid)
    const upsertFundStream = streamWrapper.asWritable(FundDAO.upsertFund)

    await new Promise((resolve, reject) => {
        const stream = fundStream
            .pipe(fundValidFilter)
            .pipe(upsertFundStream)
        stream.on('finish', resolve)
        stream.on('error', reject)
    })

    // delete funds with no data
    await db.getFunds().deleteMany({name: {$eq: null}})
    log.info('Deleted funds without names')
};

function isFundValid (fund, callback) {
    if (!fund.isValid()) {
        log.warn('Fund is not valid: %j. Skipping upsert.', fund)
        callback(null, false)
        return
    }
    callback(null, true)
}
