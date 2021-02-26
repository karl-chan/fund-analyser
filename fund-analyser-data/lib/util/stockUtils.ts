import Stock from '../stock/Stock'
import * as agGridUtils from './agGridUtils'
import { ColourFunction } from './agGridUtils'
import * as fundUtils from './fundUtils'
import * as indicators from './indicators'
import * as properties from './properties'

const lookbacks = properties.get('stock.lookbacks')

export function calcReturns (historicPrices: Stock.HistoricPrice[]) {
  return fundUtils.enrichReturns({}, historicPrices, lookbacks)
}

export async function calcIndicators (stock: Stock) {
  return indicators.calcStockIndicators(stock)
}

export function calcStats (stocks: any) {
  return fundUtils.calcStats(stocks, Stock.schema)
}

export function enrichSummary (summary: Stock[]) {
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
      'realTimeDetails.longestTimeGap': colourAroundMedian({ desc: true }),
      marketCap: colourAroundMedian()
    }
    for (const name of Object.keys(summary[0].indicators || {})) {
      colourOptions[`indicators.${name}.value`] = colourAroundZero()
    }
    summary = agGridUtils.addColours(summary, colourOptions)
  }
  return summary
}
