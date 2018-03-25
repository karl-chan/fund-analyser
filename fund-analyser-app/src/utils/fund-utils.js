import { fromPairs, max, min } from 'lodash'

const periods = ['5Y', '3Y', '1Y', '6M', '3M', '1M', '2W', '1W', '3D', '1D']

export default {
  enrichSummary (summary) {
    if (summary && summary.length) {
      const periodReturns = fromPairs(periods.map(period => [period, summary.map(row => row.returns[period])]))
      const maxReturns = fromPairs(periods.map(period => [period, max(periodReturns[period])]))
      const minReturns = fromPairs(periods.map(period => [period, min(periodReturns[period])]))

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
