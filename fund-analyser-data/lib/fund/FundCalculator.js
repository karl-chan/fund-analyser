module.exports = FundCalculator

const fundUtils = require('../util/fundUtils')
const properties = require('../util/properties')
const streamWrapper = require('../util/streamWrapper')

const async = require('async')

function FundCalculator () {
    this.lookbacks = JSON.parse(properties.get('fund.postprocessor.returns.extra.lookbacks'))
}

FundCalculator.prototype.evaluate = function (fund, callback) {
    async.waterfall([
        this.enrichReturns.bind(this, fund),
        this.calcPercentiles.bind(this),
        this.calcIndicators.bind(this)
    ], callback)
}

FundCalculator.prototype.stream = function () {
    return streamWrapper.asParallelTransform(this.evaluate.bind(this))
}

FundCalculator.prototype.enrichReturns = function (fund, callback) {
    fund.returns = fundUtils.enrichReturns(fund.returns, fund.historicPrices, this.lookbacks)
    callback(null, fund)
}

FundCalculator.prototype.calcPercentiles = function (fund, callback) {
    fund.percentiles = fundUtils.calcPercentiles(fund.returns, fund.historicPrices, this.lookbacks)
    callback(null, fund)
}

FundCalculator.prototype.calcIndicators = function (fund, callback) {
    fund.indicators = fundUtils.calcIndicators(fund.historicPrices)
    callback(null, fund)
}
