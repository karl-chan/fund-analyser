import * as _ from 'lodash'
import * as FundDAO from '../../lib/db/FundDAO'
import CharlesStanleyDirect from '../../lib/fund/CharlesStanleyDirect'
import Fund from '../../lib/fund/Fund'
import * as lang from '../../lib/util/lang'
import log from '../../lib/util/log'

/**
 * Update the latest list of isins
 * @returns {Promise.<void>}
 */
export default async function updateCatalog () {
  const docs = await FundDAO.listFunds({ projection: { isin: 1, asof: 1 } })
  const isinToDoc = _.keyBy(docs, 'isin')
  const oldIsins = Object.keys(isinToDoc)
  log.info('%d isins found in database', oldIsins.length)

  const csdFundList = await new CharlesStanleyDirect().getFundList()
  const newIsins = csdFundList.map(({ isin }) => isin)
  if (!newIsins || !newIsins.length) {
    throw new Error('No isins found')
  }

  const toRemove = lang.setDifference(oldIsins, newIsins)
  const toAdd = lang.setDifference(newIsins, oldIsins)
  log.info('To remove: %s', JSON.stringify(toRemove))
  log.info('To add: %s', JSON.stringify(toAdd))

  // delete old isins
  if (toRemove.length > 50) {
    // in case csd fails
    log.warn('Remove operation aborted, too many isins!')
  } else {
    await FundDAO.deleteFunds({ query: { isins: { $in: toRemove } } })
    log.info('Deleted old isins: %s', JSON.stringify(toRemove))
  }

  // insert new isins with time 1970
  const funds = _.map(toAdd, (isin: string) => {
    const fund = Fund.builder(isin)
      .asof(new Date(0)) // unix time 0 (1970-01-01)
      .build()
    return fund
  })
  await FundDAO.upsertFunds(funds)
  log.info('Inserted new isins: %s', JSON.stringify(toAdd))
}
