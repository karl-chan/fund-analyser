module.exports = FundCalculator

const math = require('../util/math.js')
const properties = require('../util/properties.js')
const streamWrapper = require('../util/streamWrapper.js')

const async = require('async')

function FundCalculator () {
    this.lookbacks = JSON.parse(properties.get('fund.postprocessor.returns.extra.lookbacks'))
}

FundCalculator.prototype.evaluate = function (fund, callback) {
    async.waterfall([
        this.enrichReturns.bind(this, fund),
        this.calcPercentiles.bind(this),
        this.calcStability.bind(this)
    ], callback)
}

FundCalculator.prototype.stream = function () {
    return streamWrapper.asParallelTransform(this.evaluate.bind(this))
}

FundCalculator.prototype.enrichReturns = function (fund, callback) {
    fund.returns = math.enrichReturns(fund.returns, fund.historicPrices, this.lookbacks)
    callback(null, fund)
}

FundCalculator.prototype.calcPercentiles = function (fund, callback) {
    fund.percentiles = math.calcPercentiles(fund.returns, fund.historicPrices, this.lookbacks)
    callback(null, fund)
}

FundCalculator.prototype.calcStability = function (fund, callback) {
    fund.stability = math.calcStability(fund.historicPrices)
    callback(null, fund)
}
