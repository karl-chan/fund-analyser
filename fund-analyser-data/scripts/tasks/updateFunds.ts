import BatchStream from 'batch-stream'
import { Promise } from 'bluebird'
import * as _ from 'lodash'
import moment from 'moment-business-days'
import * as FundDAO from '../../lib/db/FundDAO'
import CharlesStanleyDirect from '../../lib/fund/CharlesStanleyDirect'
import Fund from '../../lib/fund/Fund'
import FundFactory from '../../lib/fund/FundFactory'
import log from '../../lib/util/log'
import * as streamWrapper from '../../lib/util/streamWrapper'

/**
 * Update funds that need to be updated based on asof time
 * @returns {Promise.<void>}
 */
export default async function updateFunds () {
  const today = moment().utc().startOf('day')
  const lastBusinessDay = today.isBusinessDay() ? today : today.prevBusinessDay()

  const fundsToUpdate = await FundDAO.listFunds({
    query: { $or: [{ asof: { $eq: null } }, { asof: { $lt: lastBusinessDay.toDate() } }] },
    projection: { isin: 1 },
    sort: { asof: 1 }
  })
  const isins = fundsToUpdate.map((f: any) => f.isin).sort()
  log.info('Isins to update: %s (%d)', JSON.stringify(isins), isins.length)

  const fundList = await new CharlesStanleyDirect().getFundList()
  const isinToInvestmentIdLookup = _.fromPairs(fundList.map(({ investmentId, isin }) => [isin, investmentId]))
  const investmentIds = isins.map(isin => isinToInvestmentIdLookup[isin]).filter(x => x)
  log.info('Investment ids to update: %s (%d)', JSON.stringify(investmentIds), investmentIds.length)

  const fundStream = new FundFactory().streamFundsFromInvestmentIds(investmentIds)
  const fundValidFilter = streamWrapper.asFilterAsync(isFundValid)
  const upsertFundStream = streamWrapper.asWritableAsync(async (funds: Fund[]) => {
    await FundDAO.upsertFunds(funds)
  })

  await new Promise((resolve, reject) => {
    const stream = fundStream
      .pipe(fundValidFilter)
      .pipe(new BatchStream({ size: 5 }))
      .pipe(upsertFundStream)
    stream.on('finish', () => {
      log.info('Finished updating funds')
      resolve()
    })
    stream.on('error', err => {
      log.error('Fatal error, aborting updateFunds: %s', err.stack)
      reject(err)
    })
  })

  // delete funds with no data
  await FundDAO.deleteFunds({ query: { name: { $eq: null } } })
  log.info('Deleted funds without names')

  // delete outdated funds
  const cutoffDate = today.subtract(1, 'month').toDate()
  await FundDAO.deleteFunds({ query: { asof: { $lt: cutoffDate } } })
  log.info('Deleted outdated funds')
}

async function isFundValid (fund: Fund) {
  if (!fund.isValid()) {
    log.warn('Fund is not valid: %j. Skipping upsert.', fund)
    return false
  }
  log.silly('Fund is valid: %s', fund.isin)
  return true
}
