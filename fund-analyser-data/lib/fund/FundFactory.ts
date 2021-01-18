import { Promise } from 'bluebird'
import { Readable, Transform } from 'stream'
import * as streamWrapper from '../util/streamWrapper'
import CharlesStanleyDirect from './CharlesStanleyDirect'
import FinancialTimes from './FinancialTimes'
import Fund from './Fund'
import FundCalculator from './FundCalculator'

export interface FundProvider {
    getFundsFromIsins(isins: Fund[]): Promise<Fund[]>
    streamFundsFromIsins(): Transform
}

export interface IsinProvider {
    getFunds(): Promise<Fund[]> // partially filled Fund
    streamFunds(): Readable
    streamFundsFromSedols(): Transform
}

export default class FundFactory {
    fundCalculator: FundCalculator;
    fundProvider: FundProvider;
    isinProvider: IsinProvider;
    constructor () {
      this.isinProvider = new CharlesStanleyDirect()
      this.fundProvider = new FinancialTimes()
      this.fundCalculator = new FundCalculator()
    }

    async getFunds () {
      const isins = await this.isinProvider.getFunds()
      const funds = await this.fundProvider.getFundsFromIsins(isins)
      const enrichedFunds = await Promise.map(funds, this.fundCalculator.evaluate)
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
