import { Promise } from 'bluebird'
import CharlesStanleyDirect from './CharlesStanleyDirect'
import FinancialTimes from './FinancialTimes'
import FundCalculator from './FundCalculator'
import * as streamWrapper from '../util/streamWrapper'
export default class FundFactory {
    fundCalculator: any;
    fundProvider: any;
    isinProvider: any;
    constructor () {
      this.isinProvider = new CharlesStanleyDirect()
      this.fundProvider = new FinancialTimes()
      this.fundCalculator = new FundCalculator()
    }

    async getFunds () {
      const isins = await this.isinProvider.getFunds()
      const funds = await this.fundProvider.getFundsFromIsins(isins)
      const enrichedFunds = await (Promise as any).map(funds, this.fundCalculator.evaluate.bind(this))
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

    streamFundsFromSedols (sedols: any) {
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
