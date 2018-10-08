module.exports = updateFunds

const FundFactory = require('../../lib/fund/FundFactory')
const FundDAO = require('../../lib/db/FundDAO')
const streamWrapper = require('../../lib/util/streamWrapper')
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

    const fundsToUpdate = await FundDAO.listFunds({
        query: {$or: [{asof: {$eq: null}}, {asof: {$lt: today}}]},
        projection: {sedol: 1}
    })
    const sedols = _.map(fundsToUpdate, f => f.sedol)
    log.info('Sedols to update: %s', JSON.stringify(sedols))

    const fundStream = new FundFactory().streamFundsFromSedols(sedols)
    const fundValidFilter = streamWrapper.asFilterAsync(isFundValid)
    const upsertFundStream = streamWrapper.asWritableAsync(async fund => {
        FundDAO.upsertFunds([fund])
    })

    await new Promise((resolve, reject) => {
        const stream = fundStream
            .pipe(fundValidFilter)
            .pipe(upsertFundStream)
        stream.on('finish', () => {
            log.info('Finished updating funds')
            resolve()
        })
        stream.on('error', (err) => {
            log.error('Fatal error, aborting updateFunds: %s', err.stack)
            reject(err)
        })
    })

    // delete funds with no data
    await FundDAO.deleteFunds({query: {name: {$eq: null}}})
    log.info('Deleted funds without names')
};

async function isFundValid (fund) {
    if (!fund.isValid()) {
        log.warn('Fund is not valid: %j. Skipping upsert.', fund)
        return false
    }
    return true
}
