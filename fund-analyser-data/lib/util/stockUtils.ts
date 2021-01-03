import Stock from '../stock/Stock'
import * as fundUtils from './fundUtils'
import * as indicators from './indicators'
import * as properties from './properties'

const lookbacks = properties.get('stock.lookbacks')

export function calcReturns (historicPrices: any) {
  return fundUtils.enrichReturns({}, historicPrices, lookbacks)
}

export async function calcIndicators (stock: any) {
  return indicators.calcStockIndicators(stock)
}

export function calcStats (stocks: any) {
  return fundUtils.calcStats(stocks, Stock.schema)
}

export function enrichSummary (summary: any) {
  return fundUtils.enrichSummary(summary)
}
