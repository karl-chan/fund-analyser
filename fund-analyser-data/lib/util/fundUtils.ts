import moment from 'moment'
import * as _ from 'lodash'
import * as agGridUtils from './agGridUtils'
import * as lang from './lang'
import * as stat from './stat'
import * as indicators from './indicators'
import Fund from '../fund/Fund'

export function closestRecord (lookback: any, historicPrices: {date: Date}[]) {
  if (!historicPrices || !historicPrices.length) {
    return null
  }

  // Remove last record as we don't want last record to be included in search later on
  const latestDate = moment.utc(_.last(historicPrices).date)
  const duration = moment.duration(`P${lookback}`)
  const beginDate = latestDate.clone().subtract(duration)

  // Date safe check - if no record as old as requirement, abort for current iteration
  if (beginDate.isBefore(_.head(historicPrices).date)) {
    return null
  }

  const beginRecord = _.minBy(historicPrices, (record: any) => {
    const recordDate = moment.utc(record.date)
    const millisDiff = recordDate.diff(beginDate)
    return recordDate.isBefore(latestDate) ? Math.abs(millisDiff) : Infinity // don't return same date record
  })
  return beginRecord
}

export function closestRecordBeforeDate (date: any, historicPrices: any) {
  let low = 0
  let high = historicPrices.length - 1
  // binary search
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    const compareDate = historicPrices[mid].date
    const diff = compareDate.getTime() - date.getTime()
    if (diff === 0) {
      return historicPrices[mid]
    } else if (diff > 0) {
      high = mid
    } else {
      low = mid
      if (low + 1 === high) {
        low = date.getTime() >= historicPrices[high].date.getTime() ? high : low
        break
      }
    }
  }
  return historicPrices[low]
}

// drop while gaps in series if there is a large gap (e.g. 1 year) in the middle
export function dropWhileGaps (historicPrices: any) {
  const multiplier = 30
  const sampleLastN = 5
  if (historicPrices.length < sampleLastN) {
    return historicPrices
  }

  const zippedHistoricPrices = _.zip(historicPrices, _.tail(historicPrices))
  // @ts-expect-error ts-migrate(7031) FIXME: Binding element 'hp1' implicitly has an 'any' type... Remove this comment to see the full error message
  const averageGap = _.mean(_.map(_.takeRight(_.dropRight(zippedHistoricPrices, 1), sampleLastN - 1), ([hp1, hp2]) => hp2.date - hp1.date))

  const thresholdGap = multiplier * averageGap
  // @ts-expect-error ts-migrate(7031) FIXME: Binding element 'hp1' implicitly has an 'any' type... Remove this comment to see the full error message
  return _.unzip(_.takeRightWhile(zippedHistoricPrices, ([hp1, hp2]) => hp2 === undefined || hp2.date - hp1.date < thresholdGap))[0]
}

export function enrichReturns (returns: any, historicPrices: Fund.HistoricPrice[], additionalLookbacks: any) {
  // Null safe check
  if (!_.isPlainObject(returns) || _.isEmpty(historicPrices) || _.isEmpty(additionalLookbacks)) {
    return returns
  }

  const latestPrice = _.last(historicPrices).price
  const newReturns = _.clone(returns)
  _.forEach(additionalLookbacks, (lookback: any) => {
    const beginRecord = closestRecord(lookback, historicPrices)
    if (_.isNil(beginRecord)) {
      newReturns[lookback] = null
    } else {
      const beginPrice = beginRecord.price
      newReturns[lookback] = (latestPrice - beginPrice) / beginPrice
    }
  })
  return newReturns
}

export async function calcIndicators (fund: any) {
  return indicators.calcFundIndicators(fund)
}

export function calcStats (funds: any, schema : object = Fund.schema) {
  if (!funds.length) {
    return undefined
  }

  const columns = [
    ...lang.deepKeysSatisfying(schema, (k: any, v: any) => v === 'number' || v === 'Date'),
    ...Object.keys(funds[0].indicators || {}).map(name => `indicators.${name}.value`)
  ]
  const colToValues = _.fromPairs(columns.map(col => {
    return [col, funds.map((f: any) => _.get(f, col))]
  }))

  const min = lang.pairsToDeepObject(columns.map(col => [col, stat.min(colToValues[col])]))
  const q1 = lang.pairsToDeepObject(columns.map(col => [col, stat.q1(colToValues[col])]))
  const median = lang.pairsToDeepObject(columns.map(col => [col, stat.median(colToValues[col])]))
  const q3 = lang.pairsToDeepObject(columns.map(col => [col, stat.q3(colToValues[col])]))
  const max = lang.pairsToDeepObject(columns.map(col => [col, stat.max(colToValues[col])]))
  return { min, q1, median, q3, max }
}

export function enrichRealTimeDetails (realTimeDetails: any, fund: any) {
  // excluding nulls
  const holdingsX = realTimeDetails.holdings
    .filter((h: any) => h.todaysChange != null)
    .map((h: any) => [h.weight, h.todaysChange])
  const estChange = stat.weightedMean(holdingsX)
  const stdev = stat.weightedStd(holdingsX)
  const ci = stat.ci95(estChange, stdev, holdingsX.length)

  const latestPrice = _.get(_.last(fund.historicPrices), 'price')
  const estPrice = latestPrice * (1 + estChange)

  const enrichment = { estChange, estPrice, stdev, ci }
  return { ...enrichment, ...realTimeDetails }
}

export function enrichSummary (summary: any) {
  // add +1D to returns
  summary
    .filter((row: any) => row.returns)
    .forEach((row: any) => {
      row.returns['+1D'] = row.realTimeDetails ? row.realTimeDetails.estChange : NaN
    })

  // add colours to returns
  if (summary.length) {
    const { colourAroundZero } = agGridUtils
    const colourOptions = {
      // RHS is array of func args
      'returns.$lookback': [colourAroundZero],
      'returns.+1D': [colourAroundZero] // include +1D
    }
    for (const name of Object.keys(summary[0].indicators || {})) {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      colourOptions[`indicators.${name}.value`] = [colourAroundZero]
    }
    summary = agGridUtils.addColours(summary, colourOptions)
  }
  return summary
}
