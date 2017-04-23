module.exports = FundPostprocessor;

const Fund = require('./Fund.js');
const math = require('../util/math.js');
const http = require('../util/http.js');
const log = require('../util/log.js');
const properties = require('../util/properties.js');
const streamWrapper = require('../util/streamWrapper.js');

const _ = require('lodash');
const async = require('async');
const cheerio = require('cheerio');

function FundPostprocessor() {
    this.lookbacks = JSON.parse(properties.get('fund.postprocessor.returns.extra.lookbacks'));
}

FundPostprocessor.prototype.apply = function (fund, callback) {
    async.waterfall([
        this.applyOnReturns.bind(this, fund)
    ], callback);
};

FundPostprocessor.prototype.stream = function () {
    return streamWrapper.asParallelTransform(this.apply.bind(this));
};

FundPostprocessor.prototype.applyOnReturns = function (fund, callback) {
    fund.returns = math.computeAndAppendReturns(fund.returns, fund.historicPrices, this.lookbacks)
    callback(null, fund);
};
