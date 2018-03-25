import { fromPairs, max, min } from 'lodash'
import { median, stdev } from 'jStat'

const periods = ['5Y', '3Y', '1Y', '6M', '3M', '1M', '2W', '1W', '3D', '1D']

export default {
  calcSummaryStats (summary) {
    const periodReturns = fromPairs(periods.map(period => [period, summary.map(row => row.returns[period]).filter(isFinite)]))
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
  enrichSummary (summary) {
    if (summary && summary.length) {
      const { minReturns, maxReturns } = this.calcSummaryStats(summary)
      summary = summary.map(row => {
        const scores = fromPairs(Object.entries(row.returns).map(([period, ret]) => {
          const score = ret > 0 ? ret / maxReturns[period] : (ret < 0 ? -ret / minReturns[period] : ret)
          return [period, score]
        }))
        return { ...row, ...{ metadata: { scores } } }
      })
    }
    return summary
  }
}
