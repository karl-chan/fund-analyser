const fundUtils = require('../util/fundUtils')
const properties = require('../util/properties')
const streamWrapper = require('../util/streamWrapper')

class FundCalculator {
    constructor () {
        this.lookbacks = JSON.parse(properties.get('fund.postprocessor.returns.extra.lookbacks'))
    }

    async evaluate (fund) {
        fund = await this.enrichReturns(fund)
        fund = await this.calcIndicators(fund)
        return fund
    }

    stream () {
        return streamWrapper.asParallelTransform(this.evaluate.bind(this))
    }

    enrichReturns (fund) {
        fund.returns = fundUtils.enrichReturns(fund.returns, fund.historicPrices, this.lookbacks)
        return fund
    }
    calcIndicators (fund) {
        fund.indicators = fundUtils.calcIndicators(fund.historicPrices)
        return fund
    }
}

module.exports = FundCalculator
