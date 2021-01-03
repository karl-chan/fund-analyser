import * as fundUtils from '../util/fundUtils'
import * as properties from '../util/properties'
import * as streamWrapper from '../util/streamWrapper'
import log from '../util/log'

export default class FundCalculator {
    lookbacks: any;
    constructor () {
      this.lookbacks = properties.get('fund.lookbacks')
    }

    async evaluate (fund: any) {
      fund = await this.enrichReturns(fund)
      fund = await this.calcIndicators(fund)
      log.silly('Calculated for isin: %s', fund.isin)
      return fund
    }

    stream () {
      return streamWrapper.asTransformAsync(this.evaluate.bind(this))
    }

    enrichReturns (fund: any) {
      // calculate all lookbacks from scratch, FT is unreliable
      fund.returns = fundUtils.enrichReturns(fund.returns, fund.historicPrices, this.lookbacks)
      return fund
    }

    async calcIndicators (fund: any) {
      fund.indicators = await fundUtils.calcIndicators(fund)
      return fund
    }
}
