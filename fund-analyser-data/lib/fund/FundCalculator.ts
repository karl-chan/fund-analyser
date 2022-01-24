import * as fundUtils from '../util/fundUtils'
import log from '../util/log'
import * as properties from '../util/properties'
import * as streamWrapper from '../util/streamWrapper'
import Fund from './Fund'

export default class FundCalculator {
  lookbacks: any
  constructor () {
    this.lookbacks = properties.get('fund.lookbacks')
  }

  async evaluate (fund: Fund) {
    fund = await this.enrichReturns(fund)
    fund = await this.calcIndicators(fund)
    log.silly('Calculated for isin: %s', fund.isin)
    return fund
  }

  stream () {
    return streamWrapper.asTransformAsync((fund: Fund) => this.evaluate(fund))
  }

  enrichReturns (fund: Fund) {
    // calculate all lookbacks from scratch, FT is unreliable
    return fund.toBuilder()
      .returns(fundUtils.enrichReturns(fund.returns, fund.historicPrices, this.lookbacks))
      .build()
  }

  async calcIndicators (fund: Fund) {
    const indicators = await fundUtils.calcIndicators(fund)
    return fund.toBuilder()
      .indicators(indicators)
      .build()
  }
}
