import * as stockUtils from '../util/stockUtils'
import * as streamWrapper from '../util/streamWrapper'
import log from '../util/log'

export default class StockCalculator {
  async evaluate (stock: any) {
    stock = await this.calcReturns(stock)
    stock = await this.calcIndicators(stock)
    log.silly('Calculated for symbol: %s', stock.symbol)
    return stock
  }

  stream () {
    return streamWrapper.asTransformAsync(this.evaluate.bind(this))
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
