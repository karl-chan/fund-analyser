import * as _ from 'lodash'
import * as FundDAO from '../../lib/db/FundDAO'
import CharlesStanleyDirect from '../../lib/fund/CharlesStanleyDirect'
import Fund from '../../lib/fund/Fund'
import * as lang from '../../lib/util/lang'
import log from '../../lib/util/log'

/**
 * Update the latest list of sedols
 * @returns {Promise.<void>}
 */
export default async function updateCatalog () {
  const docs = await FundDAO.listFunds({ projection: { sedol: 1, asof: 1 } })
  const sedolToDoc = _.keyBy(docs, 'sedol')
  const oldSedols = Object.keys(sedolToDoc)
  log.info('%d sedols found in database', oldSedols.length)

  const csdSedols = await new CharlesStanleyDirect().getInvestmentIds()
  // For some reason these are still available but no longer listed on CSD
  const pinnedSedols = ['B3K7SR4']
  log.info('Pinned sedols: %s', JSON.stringify(pinnedSedols))
  const newSedols = [...new Set([...csdSedols, ...pinnedSedols])]
  if (!newSedols || !newSedols.length) {
    throw new Error('No sedols found')
  }

  const toRemove = lang.setDifference(oldSedols, newSedols)
  const toAdd = lang.setDifference(newSedols, oldSedols)
  log.info('To remove: %s', JSON.stringify(toRemove))
  log.info('To add: %s', JSON.stringify(toAdd))

  // delete old sedols
  if (toRemove.length > 50) {
    // in case csd fails
    log.warn('Remove operation aborted, too many sedols!')
  } else {
    await FundDAO.deleteFunds({ query: { sedol: { $in: toRemove } } })
    log.info('Deleted old sedols: %s', JSON.stringify(toRemove))
  }

  // insert new sedols with time 1970
  const funds = _.map(toAdd, (sedol: string) => {
    const fund = Fund.builder(undefined)
      .sedol(sedol)
      .asof(new Date(0)) // unix time 0 (1970-01-01)
      .build()
    return fund
  })
  await FundDAO.upsertFunds(funds)
  log.info('Inserted new sedols: %s', JSON.stringify(toAdd))
}
