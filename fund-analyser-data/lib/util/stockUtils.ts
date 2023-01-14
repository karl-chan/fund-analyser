import * as _ from 'lodash'
import Stock from '../stock/Stock'
import * as agGridUtils from './agGridUtils'
import { ColourFunction } from './agGridUtils'
import * as fundUtils from './fundUtils'
import * as indicators from './indicators'
import * as lang from './lang'
import * as properties from './properties'
import * as stat from './stat'

const lookbacks = properties.get('stock.lookbacks')

export function calcReturns (historicPrices: Stock.HistoricPrice[]): Stock.Returns {
  return fundUtils.enrichReturns({}, historicPrices, lookbacks)
}

export async function calcIndicators (stock: Stock) : Promise<Stock.Indicators> {
  return indicators.calcStockIndicators(stock)
}

export function calcStats (stocks: Stock[]) {
  if (!stocks.length) {
    return undefined
  }

  const columns = [
    ...lang.deepKeysSatisfying(Stock.schema, (k: any, v: any) => v === 'number' || v === 'Date'),
    ...Object.keys(stocks[0].indicators || {}).map(name => `indicators.${name}.value`),
    ...Object.keys(stocks[0].fundamentals || {}).map(name => `fundamentals.${name}`)
  ]
  const colToValues = _.fromPairs(columns.map(col => {
    return [col, stocks.map(s => _.get(s, col))]
  }))

  const min = lang.pairsToDeepObject(columns.map(col => [col, stat.min(colToValues[col])]))
  const q1 = lang.pairsToDeepObject(columns.map(col => [col, stat.q1(colToValues[col])]))
  const median = lang.pairsToDeepObject(columns.map(col => [col, stat.median(colToValues[col])]))
  const q3 = lang.pairsToDeepObject(columns.map(col => [col, stat.q3(colToValues[col])]))
  const max = lang.pairsToDeepObject(columns.map(col => [col, stat.max(colToValues[col])]))
  return { min, q1, median, q3, max }
}

export function enrichSummary (summary: Stock[]): Stock[] {
  // add +1D to returns
  summary
    .filter(row => row.returns)
    .forEach(row => {
      row.returns['+1D'] = row.realTimeDetails ? row.realTimeDetails.estChange : NaN
    })

  // add colours to returns
  if (summary.length) {
    const { colourAroundZero, colourAroundMedian } = agGridUtils
    const colourOptions: {[field: string]: ColourFunction<Stock>} = {
      // RHS is array of func args
      'returns.$lookback': colourAroundZero(),
      'returns.+1D': colourAroundZero(), // include +1D
      'realTimeDetails.bidAskSpread': colourAroundMedian({ desc: true }),
      'realTimeDetails.longestTimeGap': colourAroundMedian({ desc: true })
    }

    for (const name of Object.keys(summary[0].indicators || {})) {
      colourOptions[`indicators.${name}.value`] = colourAroundZero()
    }
    // Override indicators
    colourOptions['indicators.mdt.value'] = colourAroundZero({ desc: true })

    for (const name of Object.keys(summary[0].fundamentals || {})) {
      colourOptions[`fundamentals.${name}`] = colourAroundZero()
    }
    summary = agGridUtils.addColours(summary, colourOptions)
  }
  return summary
}
