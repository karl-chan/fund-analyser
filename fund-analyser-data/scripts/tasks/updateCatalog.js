module.exports = updateCatalog

const CharlesStanleyDirect = require('../../lib/fund/CharlesStanleyDirect')
const _ = require('lodash')
const moment = require('moment')
const FundDAO = require('../../lib/db/FundDAO')
const Fund = require('../../lib/fund/Fund')
const db = require('../../lib/util/db')
const log = require('../../lib/util/log')

/**
 * Update the latest list of sedols
 * @returns {Promise.<void>}
 */
async function updateCatalog () {
    const newSedols = await new CharlesStanleyDirect().getSedols()
    if (!newSedols || !newSedols.length) {
        throw new Error('No sedols found')
    }

    const docs = await FundDAO.listFunds({project: {sedol: 1, asof: 1}}, true)
    const sedolToDoc = _.keyBy(docs, 'sedol')
    const oldSedols = Object.keys(sedolToDoc)

    const toRemove = _.difference(oldSedols, newSedols)
        .filter(sedol => moment().diff(sedolToDoc[sedol].asof, 'weeks') >= 2) // remove only if two weeks old
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
