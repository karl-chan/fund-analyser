module.exports = FundPostprocessor;

const math = require('../util/math.js');
const http = require('../util/http.js');
const properties = require('../util/properties.js');
const streamWrapper = require('../util/streamWrapper.js');

const _ = require('lodash');
const async = require('async');

function FundPostprocessor() {
    this.lookbacks = JSON.parse(properties.get('fund.postprocessor.returns.extra.lookbacks'));
}

FundPostprocessor.prototype.postprocess = function (fund, callback) {
    async.waterfall([
        this.enrichReturns.bind(this, fund),
        this.calcPercentiles.bind(this)
    ], callback);
};

FundPostprocessor.prototype.stream = function () {
    return streamWrapper.asParallelTransform(this.postprocess.bind(this));
};

FundPostprocessor.prototype.enrichReturns = function (fund, callback) {
    fund.returns = math.enrichReturns(fund.returns, fund.historicPrices, this.lookbacks)
    callback(null, fund);
};

FundPostprocessor.prototype.calcPercentiles = function (fund, callback) {
    fund.percentiles = math.calcPercentiles(fund.returns, fund.historicPrices, this.lookbacks);
    callback(null, fund);
}
