const stockUtils = require('../util/stockUtils')
const streamWrapper = require('../util/streamWrapper')
const log = require('../util/log')

class StockCalculator {
    async evaluate (fund) {
        fund = await this.calcReturns(fund)
        fund = await this.calcIndicators(fund)
        log.silly('Calculated for isin: %s', fund.isin)
        return fund
    }

    stream () {
        return streamWrapper.asTransformAsync(this.evaluate.bind(this))
    }

    calcReturns (stock) {
        stock.returns = stockUtils.calcReturns(stock.historicPrices)
        return stock
    }

    async calcIndicators (fund) {
        fund.indicators = await stockUtils.calcIndicators(fund)
        return fund
    }
}

module.exports = StockCalculator
