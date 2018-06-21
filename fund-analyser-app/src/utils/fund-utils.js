import fromPairs from 'lodash/fromPairs'
import max from 'lodash/max'
import min from 'lodash/min'
import { median, stdev } from 'jStat'

const periods = ['5Y', '3Y', '1Y', '6M', '3M', '1M', '2W', '1W', '3D', '1D']

export default {
  calcStats (funds) {
    const periodReturns = fromPairs(periods.map(period => [period, funds.map(fund => fund.returns && fund.returns[period]).filter(isFinite)]))
    const maxReturns = fromPairs(periods.map(period => [period, max(periodReturns[period])]))
    const minReturns = fromPairs(periods.map(period => [period, min(periodReturns[period])]))
    const meanReturns = fromPairs(periods.map(period => [period, (maxReturns[period] + minReturns[period]) / 2]))
    const medianReturns = fromPairs(periods.map(period => [period, median(periodReturns[period])]))
    const stddevReturns = fromPairs(periods.map(period => [period, stdev(periodReturns[period])]))
    return {
      minReturns,
      maxReturns,
      meanReturns,
      medianReturns,
      stddevReturns
    }
  },
  enrichScores (funds) {
    if (funds && funds.length) {
      const { minReturns, maxReturns } = this.calcStats(funds)
      funds = funds.map(fund => {
        const scores = fund.returns ? fromPairs(Object.entries(fund.returns).map(([period, ret]) => {
          const score = ret > 0 ? ret / maxReturns[period] : (ret < 0 ? -ret / minReturns[period] : ret)
          return [period, score]
        })) : {}
        return { ...fund, ...{ metadata: { scores } } }
      })
    }
    return funds
  }
}
