const fundUtils = require('../util/fundUtils')
const properties = require('../util/properties')
const streamWrapper = require('../util/streamWrapper')
const log = require('../util/log')

class FundCalculator {
    constructor () {
        this.lookbacks = properties.get('fund.lookbacks')
    }

    async evaluate (fund) {
        fund = await this.enrichReturns(fund)
        fund = await this.calcIndicators(fund)
        log.silly('Calculated for isin: %s', fund.isin)
        return fund
    }

    stream () {
        return streamWrapper.asTransformAsync(this.evaluate.bind(this))
    }

    enrichReturns (fund) {
        const extraLookbacks = this.lookbacks.filter(lookback => !(lookback in fund.returns))
        fund.returns = fundUtils.enrichReturns(fund.returns, fund.historicPrices, extraLookbacks)
        return fund
    }
    calcIndicators (fund) {
        fund.indicators = fundUtils.calcIndicators(fund.historicPrices)
        return fund
    }
}

module.exports = FundCalculator
