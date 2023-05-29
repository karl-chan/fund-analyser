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

export interface InvestmentIdProvider {
    getFunds(): Promise<Fund[]> // partially filled Fund
    streamFunds(): Readable
    streamFundsFromInvestmentIds(): Transform
}

export default class FundFactory {
  fundCalculator: FundCalculator
  fundProvider: FundProvider
  investmentIdProvider: InvestmentIdProvider
  constructor () {
    this.investmentIdProvider = new CharlesStanleyDirect()
    this.fundProvider = new FinancialTimes()
    this.fundCalculator = new FundCalculator()
  }

  async getFunds () {
    const isins = await this.investmentIdProvider.getFunds()
    const funds = await this.fundProvider.getFundsFromIsins(isins)
    const enrichedFunds = await Promise.map(funds, fund => this.fundCalculator.evaluate(fund))
    return enrichedFunds
  }

  streamFunds () {
    const isinStream = this.investmentIdProvider.streamFunds()
    const isinToFundStream = this.fundProvider.streamFundsFromIsins()
    const fundCalculationStream = this.fundCalculator.stream()
    const fundStream = isinStream
      .pipe(isinToFundStream)
      .pipe(fundCalculationStream)
    return fundStream
  }

  streamFundsFromInvestmentIds (investmentIds: string[]) {
    const investmentIdStream = streamWrapper.asReadableAsync(async () => investmentIds)
    const investmentIdToFundStream = this.investmentIdProvider.streamFundsFromInvestmentIds()
    const isinToFundStream = this.fundProvider.streamFundsFromIsins()
    const fundCalculationStream = this.fundCalculator.stream()
    const fundStream = investmentIdStream
      .pipe(investmentIdToFundStream)
      .pipe(isinToFundStream)
      .pipe(fundCalculationStream)
    return fundStream
  }
}
