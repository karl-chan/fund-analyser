import log from '../util/log'
import * as stockUtils from '../util/stockUtils'
import * as streamWrapper from '../util/streamWrapper'
import Stock from './Stock'

export default class StockCalculator {
  async evaluate (stock: Stock) {
    stock = await this.calcReturns(stock)
    stock = await this.calcIndicators(stock)
    log.silly('Calculated for symbol: %s', stock.symbol)
    return stock
  }

  stream () {
    return streamWrapper.asTransformAsync((stock: Stock) => this.evaluate(stock))
  }

  calcReturns (stock: Stock) {
    return stock.toBuilder()
      .returns(stockUtils.calcReturns(stock.historicPrices))
      .build()
  }

  async calcIndicators (stock: Stock) {
    return stock.toBuilder()
      .indicators(stockUtils.calcIndicators(stock))
      .build()
  }
}
