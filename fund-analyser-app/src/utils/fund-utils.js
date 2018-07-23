import fromPairs from 'lodash/fromPairs'
import isFinite from 'lodash/isFinite'
import { max, min, median } from 'jStat'

const periods = ['5Y', '3Y', '1Y', '6M', '3M', '1M', '2W', '1W', '3D', '1D', '+1D']

export default {
  calcStats (funds) {
    const periodReturns = fromPairs(periods.map(period => [period, funds.map(fund => fund.returns && fund.returns[period]).filter(isFinite)]))
    const maxReturns = fromPairs(periods.map(period => [period, max(periodReturns[period])]))
    const minReturns = fromPairs(periods.map(period => [period, min(periodReturns[period])]))
    // const meanReturns = fromPairs(periods.map(period => [period, mean(periodReturns[period])]))
    const medianReturns = fromPairs(periods.map(period => [period, median(periodReturns[period])]))
    // const stddevReturns = fromPairs(periods.map(period => [period, stdev(periodReturns[period])]))
    // const meddevReturns = fromPairs(periods.map(period => [period, meddev(periodReturns[period])]))
    return {
      minReturns,
      maxReturns,
      // meanReturns,
      medianReturns
      // stddevReturns,
      // meddevReturns
    }
  },
  copyRealTimeEstToReturns (funds) {
    return funds.map(fund => {
      const newReturns = {...fund.returns, '+1D': fund.realTimeDetails ? fund.realTimeDetails.estChange : NaN}
      return {...fund, returns: newReturns}
    })
  },
  enrichScores (funds) {
    if (funds && funds.length) {
      funds = this.copyRealTimeEstToReturns(funds)

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
