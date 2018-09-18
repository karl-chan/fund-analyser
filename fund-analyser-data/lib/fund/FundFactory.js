const CharlesStanleyDirect = require('./CharlesStanleyDirect')
const FinancialTimes = require('./FinancialTimes')
const FundCalculator = require('./FundCalculator')
const streamWrapper = require('../util/streamWrapper')

const Promise = require('bluebird')

class FundFactory {
    constructor () {
        this.isinProvider = new CharlesStanleyDirect()
        this.fundProvider = new FinancialTimes()
        this.fundCalculator = new FundCalculator()
    }

    async getFunds () {
        const isins = await this.isinProvider.getFunds()
        const funds = await this.fundProvider.getFundsFromIsins(isins)
        const enrichedFunds = await Promise.map(funds, this.fundCalculator.evaluate.bind(this))
        return enrichedFunds
    }

    streamFunds () {
        const isinStream = this.isinProvider.streamFunds()
        const isinToFundStream = this.fundProvider.streamFundsFromIsins()
        const fundCalculationStream = this.fundCalculator.stream()

        const fundStream = isinStream
            .pipe(isinToFundStream)
            .pipe(fundCalculationStream)
        return fundStream
    }

    streamFundsFromSedols (sedols) {
        const sedolStream = streamWrapper.asReadableAsync(async () => sedols)
        const isinStream = this.isinProvider.streamFundsFromSedols()
        const isinToFundStream = this.fundProvider.streamFundsFromIsins()
        const fundCalculationStream = this.fundCalculator.stream()

        const fundStream = sedolStream
            .pipe(isinStream)
            .pipe(isinToFundStream)
            .pipe(fundCalculationStream)
        return fundStream
    }
}

module.exports = FundFactory
