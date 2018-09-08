module.exports = FundFactory

const CharlesStanleyDirect = require('./CharlesStanleyDirect')
const FinancialTimes = require('./FinancialTimes')
const FundCalculator = require('./FundCalculator')

const async = require('async')
const StreamTest = require('streamtest')

function FundFactory () {
    this.isinProvider = new CharlesStanleyDirect()
    this.fundProvider = new FinancialTimes()
    this.fundCalculator = new FundCalculator()
}

FundFactory.prototype.getFunds = function (callback) {
    async.waterfall([
        this.isinProvider.getFunds.bind(this.isinProvider),
        this.fundProvider.getFundsFromIsins.bind(this.fundProvider),
        this.fundCalculator.evaluate.bind(this.fundCalculator)
    ], callback)
}

FundFactory.prototype.streamFunds = function () {
    const isinStream = this.isinProvider.streamFunds()
    const isinToFundStream = this.fundProvider.streamFundsFromIsins()
    const fundCalculationStream = this.fundCalculator.stream()

    const fundStream = isinStream
        .pipe(isinToFundStream)
        .pipe(fundCalculationStream)
    return fundStream
}

FundFactory.prototype.streamFundsFromSedols = function (sedols) {
    const sedolStream = StreamTest['v2'].fromObjects(sedols)
    const isinStream = this.isinProvider.streamFundsFromSedols()
    const isinToFundStream = this.fundProvider.streamFundsFromIsins()
    const fundCalculationStream = this.fundCalculator.stream()

    const fundStream = sedolStream
        .pipe(isinStream)
        .pipe(isinToFundStream)
        .pipe(fundCalculationStream)
    return fundStream
}
