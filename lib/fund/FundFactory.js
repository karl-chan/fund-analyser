module.exports = FundFactory;

const CharlesStanleyDirect = require('./CharlesStanleyDirect.js');
const FinancialTimes = require('./FinancialTimes.js');
const FundPostprocessor = require('./FundPostprocessor.js');

const async = require('async');

function FundFactory() {
    this.isinProvider = new CharlesStanleyDirect();
    this.fundProvider = new FinancialTimes();
    this.fundPostprocessor = new FundPostprocessor();
}

FundFactory.prototype.getFunds = function (callback) {
    async.waterfall([
        this.isinProvider.getIsins.bind(this.isinProvider),
        this.fundProvider.getFundsFromIsins.bind(this.fundProvider),
        this.fundPostprocessor.postprocess.bind(this.fundPostprocessor)
    ], callback);
};

FundFactory.prototype.streamFunds = function (callback) {
    const isinStream = this.isinProvider.streamIsins();
    const isinToFundStream = this.fundProvider.streamFundsFromIsins();
    const fundPostprocessingStream = this.fundPostprocessor.stream();

    const fundStream = isinStream
        .pipe(isinToFundStream)
        .pipe(fundPostprocessingStream);
    return fundStream;
};