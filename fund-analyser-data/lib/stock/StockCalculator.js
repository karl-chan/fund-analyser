const stockUtils = require('../util/stockUtils')
const streamWrapper = require('../util/streamWrapper')
const log = require('../util/log')

class StockCalculator {
    async evaluate (stock) {
        stock = await this.calcReturns(stock)
        stock = await this.calcIndicators(stock)
        log.silly('Calculated for symbol: %s', stock.symbol)
        return stock
    }

    stream () {
        return streamWrapper.asTransformAsync(this.evaluate.bind(this))
    }

    calcReturns (stock) {
        stock.returns = stockUtils.calcReturns(stock.historicPrices)
        return stock
    }

    async calcIndicators (stock) {
        stock.indicators = await stockUtils.calcIndicators(stock)
        return stock
    }
}

module.exports = StockCalculator
