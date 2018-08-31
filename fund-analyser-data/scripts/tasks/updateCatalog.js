module.exports = updateCatalog

const CharlesStanleyDirect = require('../../lib/fund/CharlesStanleyDirect')
const _ = require('lodash')
const FundDAO = require('../../lib/db/FundDAO.js')
const Fund = require('../../lib/fund/Fund.js')
const db = require('../../lib/util/db.js')
const log = require('../../lib/util/log.js')

/**
 * Update the latest list of sedols
 * @returns {Promise.<void>}
 */
async function updateCatalog () {
    const newSedols = await new Promise((resolve, reject) => {
        new CharlesStanleyDirect().getSedols((err, sedols) => {
            if (sedols && sedols.length) {
                resolve(sedols)
            } else {
                reject(err || new Error('No sedols found'))
            }
        })
    })

    const oldSedols = await new Promise((resolve, reject) => {
        FundDAO.listFunds({project: {sedol: 1}}, (err, funds) => {
            if (err) {
                reject(err)
            } else {
                const sedols = _.map(funds, f => f.sedol)
                resolve(sedols)
            }
        })
    })

    const toRemove = _.difference(oldSedols, newSedols)
    const toAdd = _.difference(newSedols, oldSedols)
    log.info(`To remove: %s`, JSON.stringify(toRemove))
    log.info(`To add: %s`, JSON.stringify(toAdd))

    // delete old sedols
    await db.getFunds().deleteMany({sedol: {$in: toRemove}})
    log.info('Deleted old sedols: %s', JSON.stringify(toRemove))

    // insert new sedols with time 1970
    const funds = _.map(toAdd, (sedol) => {
        const fund = Fund.Builder()
            .sedol(sedol)
            .asof(new Date(0)) // unix time 0 (1970-01-01)
            .build()
        return fund
    })
    await FundDAO.upsertFunds(funds)
    log.info('Inserted new sedols: %s', JSON.stringify(toAdd))
};
