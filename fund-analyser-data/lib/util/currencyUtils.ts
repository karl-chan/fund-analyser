import * as _ from 'lodash'
import Currency from '../currency/Currency'
import * as agGridUtils from './agGridUtils'
import * as fundUtils from './fundUtils'
import * as lang from './lang'
import * as properties from './properties'
import * as stat from './stat'

const lookbacks = properties.get('fund.lookbacks')

export function invertCurrency (currency: Currency) {
  const invertedRates = currency.historicRates.map((hr: any) => new Currency.HistoricRate(hr.date, 1 / hr.rate))
  const invertedReturns: {[pair: string]: number} = {}
  for (const [k, v] of Object.entries(currency.returns)) {
    invertedReturns[k] = 1 / (v + 1) - 1
  }
  return new Currency(currency.quote, currency.base, invertedRates, invertedReturns)
}

export function multiplyCurrencies (currency1: Currency, currency2: Currency) {
  if (currency1.quote !== currency2.base) {
    throw new Error('currency1.quote must === currency2.base for multiplication to happen!')
  }

  let multipliedRates = []
  let firstPtr = 0; let secondPtr = 0
  while (firstPtr < currency1.historicRates.length && secondPtr < currency2.historicRates.length) {
    let { date: firstDate, rate: firstRate } = currency1.historicRates[firstPtr]
    let { date: secondDate, rate: secondRate } = currency2.historicRates[secondPtr]
    if (firstDate.getTime() === secondDate.getTime()) {
      multipliedRates.push(new Currency.HistoricRate(firstDate, firstRate * secondRate))
      firstPtr++
      secondPtr++
    } else if (firstDate < secondDate) {
      secondRate = currency2.historicRates[Math.max(0, secondPtr - 1)].rate
      multipliedRates.push(new Currency.HistoricRate(firstDate, firstRate * secondRate))
      firstPtr++
    } else {
      firstRate = currency1.historicRates[Math.max(0, firstPtr - 1)].rate
      multipliedRates.push(new Currency.HistoricRate(secondDate, firstRate * secondRate))
      secondPtr++
    }
  }
  // add remaining tail
  let tail: Currency.HistoricRate[] = []
  if (firstPtr < currency1.historicRates.length) {
    tail = currency1.historicRates
      .slice(firstPtr)
      .map((hr: any) => new Currency.HistoricRate(hr.date, hr.rate * _.last(currency2.historicRates).rate))
  } else if (secondPtr < currency2.historicRates.length) {
    tail = currency2.historicRates
      .slice(secondPtr)
      .map((hr: any) => new Currency.HistoricRate(hr.date, _.last(currency1.historicRates).rate * hr.rate))
  }
  multipliedRates = multipliedRates.concat(tail)
  const returns = calcReturns(multipliedRates)
  return new Currency(currency1.base, currency2.quote, multipliedRates, returns)
}

export function calcReturns (historicRates: Currency.HistoricRate[]) {
  // Null safe check
  const returns: {[lookback: string]: number} = {}
  if (_.isEmpty(historicRates) || _.isEmpty(lookbacks)) {
    return returns
  }

  const latestRate = _.last(historicRates).rate
  _.forEach(lookbacks, (lookback: any) => {
    const beginRecord = fundUtils.closestRecord(lookback, historicRates)
    if (_.isNil(beginRecord)) {
      returns[lookback] = null
    } else {
      const beginRate = beginRecord.rate
      returns[lookback] = (latestRate - beginRate) / beginRate
    }
  })
  return returns
}

export function calcStats (currencies: Currency[]) {
  if (!currencies.length) {
    return undefined
  }

  const columns: string[] = lang.deepKeysSatisfying(Currency.schema, (k: any, v: any) => v === 'number' || v === 'Date')
  const colToValues = _.fromPairs(columns.map(col => {
    return [col, currencies.map(c => _.get(c, col))]
  }))

  const min = lang.pairsToDeepObject(columns.map((col: any) => [col, stat.min(colToValues[col])]))
  const q1 = lang.pairsToDeepObject(columns.map((col: any) => [col, stat.q1(colToValues[col])]))
  const median = lang.pairsToDeepObject(columns.map((col: any) => [col, stat.median(colToValues[col])]))
  const q3 = lang.pairsToDeepObject(columns.map((col: any) => [col, stat.q3(colToValues[col])]))
  const max = lang.pairsToDeepObject(columns.map((col: any) => [col, stat.max(colToValues[col])]))
  return { min, q1, median, q3, max }
}

export function enrichSummary (summary: any) {
  // add colours to retuns
  const { colourAroundZero } = agGridUtils
  const colourOptions = {
    'returns.$lookback': colourAroundZero()
  }
  summary = agGridUtils.addColours(summary, colourOptions)
  return summary
}
