import log from '../util/log'
import * as stockUtils from '../util/stockUtils'
import * as streamWrapper from '../util/streamWrapper'

export default class StockCalculator {
  async evaluate (stock: any) {
    stock = await this.calcReturns(stock)
    stock = await this.calcIndicators(stock)
    log.silly('Calculated for symbol: %s', stock.symbol)
    return stock
  }

  stream () {
    return streamWrapper.asTransformAsync(this.evaluate)
  }

  calcReturns (stock: any) {
    stock.returns = stockUtils.calcReturns(stock.historicPrices)
    return stock
  }

  async calcIndicators (stock: any) {
    stock.indicators = await stockUtils.calcIndicators(stock)
    return stock
  }
}
