module.exports = {
    pcToFloat,
    floatToPc,
    enrichReturns,
    calcPercentiles,
    calcIndicators,
    calcStats,
    closestRecord,
    enrichRealTimeDetails,
    enrichSummary
}

const _ = require('lodash')
const moment = require('moment')
const stat = require('./stat')
const indicators = require('./indicators')

function pcToFloat (pc) {
    return parseFloat(pc) / 100.0
};

function floatToPc (float) {
    return _.isFinite(float) ? `${float * 100}%` : float
}

// function sedolToIsin (sedol) {
//     const isinNoCheckDigit = 'GB00' + sedol
//     const digitString = Array.prototype.map
//         .call(isinNoCheckDigit, a => `${parseInt(a, 36)}`)
//         .join('')
//     const nums = Array.prototype.map.call(digitString, digit => parseInt(digit, 10))
//     for (let i = nums.length - 1; i >= 0; i -= 2) {
//         nums[i] *= 2
//     }
//     const digitSum = _.sumBy(nums, n => {
//         return _.sum(Array.prototype.map.call(`${n}`, digit => parseInt(digit, 10)))
//     })
//     const checkDigit = (10 - digitSum % 10) % 10
//     return `${isinNoCheckDigit}${checkDigit}`
// };

function closestRecord (lookback, historicPrices) {
    // Remove last record as we don't want last record to be included in search later on
    const latestDate = moment.utc(_.last(historicPrices).date)
    const duration = moment.duration(`P${lookback}`)
    const beginDate = latestDate.clone().subtract(duration)

    // Date safe check - if no record as old as requirement, abort for current iteration
    // if (beginDate.isBefore(_.head(historicPrices).date)) {
    //     return null;
    // }

    const beginRecord = _.minBy(historicPrices, (record) => {
        const recordDate = moment.utc(record.date)
        const millisDiff = recordDate.diff(beginDate)
        return recordDate.isBefore(latestDate) ? Math.abs(millisDiff) : Infinity // don't return same date record
    })
    return beginRecord
}

function enrichReturns (returns, historicPrices, additionalLookbacks) {
    // Null safe check
    if (_.isEmpty(returns) || _.isEmpty(historicPrices) || _.isEmpty(additionalLookbacks)) {
        return returns
    }

    const latestPrice = _.last(historicPrices).price
    const newReturns = _.clone(returns)
    _.forEach(additionalLookbacks, (lookback) => {
        const beginRecord = closestRecord(lookback, historicPrices)
        if (_.isNil(beginRecord)) {
            return
        }
        const beginPrice = beginRecord.price
        newReturns[lookback] = (latestPrice - beginPrice) / beginPrice
    })
    return newReturns
}

function calcPercentiles (returns, historicPrices, additionalLookbacks) {
    const percentiles = {}

    // Null safe check
    if (_.isEmpty(returns) || _.isEmpty(historicPrices)) {
        return percentiles
    }

    const lookbacks = _.union(_.keys(returns), additionalLookbacks)
    const latestPrice = _.last(historicPrices).price
    _.forEach(lookbacks, (lookback) => {
        const beginRecord = closestRecord(lookback, historicPrices)
        if (_.isNil(beginRecord)) {
            return
        }
        const interestedRecords = _.dropWhile(historicPrices, (record) => moment.utc(record.date).isBefore(beginRecord.date))
        const minPrice = _.minBy(interestedRecords, (record) => record.price).price
        const maxPrice = _.maxBy(interestedRecords, (record) => record.price).price
        const percentile = minPrice === maxPrice ? NaN : (latestPrice - minPrice) / (maxPrice - minPrice) // careful division by 0
        percentiles[lookback] = percentile
    })
    return percentiles
}

function calcIndicators (historicPrices) {
    const stability = indicators.calcStability(historicPrices)
    return { stability }
}

function calcStats (funds) {
    if (!funds.length) {
        return undefined
    }
    const periods = Object.keys(funds[0].returns)
    const periodReturns = _.fromPairs(periods.map(period => [period, funds.map(fund => fund.returns && fund.returns[period]).filter(isFinite)]))
    const maxReturns = _.fromPairs(periods.map(period => [period, stat.max(periodReturns[period])]))
    const minReturns = _.fromPairs(periods.map(period => [period, stat.min(periodReturns[period])]))
    // const meanReturns = _.fromPairs(periods.map(period => [period, mean(periodReturns[period])]))
    const medianReturns = _.fromPairs(periods.map(period => [period, stat.median(periodReturns[period])]))
    // const stddevReturns = _.fromPairs(periods.map(period => [period, stdev(periodReturns[period])]))
    // const meddevReturns = _.fromPairs(periods.map(period => [period, meddev(periodReturns[period])]))
    return {
        minReturns,
        maxReturns,
        // meanReturns,
        medianReturns
        // stddevReturns,
        // meddevReturns
    }
}

function enrichRealTimeDetails (realTimeDetails, fund) {
    // excluding nulls
    const holdingsX = realTimeDetails.holdings
        .filter(h => h.todaysChange != null)
        .map(h => [h.weight, h.todaysChange])
    const estChange = stat.weightedMean(holdingsX)
    const stdev = stat.weightedStd(holdingsX)
    const ci = stat.ci95(estChange, stdev, holdingsX.length)

    const latestPrice = _.last(fund.historicPrices).price
    const estPrice = latestPrice * (1 + estChange)

    const enrichment = { estChange, estPrice, stdev, ci }
    return {...enrichment, ...realTimeDetails}
}

function enrichSummary (summary) {
    // add +1D to returns
    summary.forEach(row => {
        row.returns['+1D'] = row.realTimeDetails ? row.realTimeDetails.estChange : NaN
    })

    const periods = Object.keys(summary[0].returns)
    const periodReturns = _.fromPairs(periods.map(period => [period, summary.map(row => row.returns[period])]))
    const maxReturns = _.fromPairs(periods.map(period => [period, _.max(periodReturns[period])]))
    const minReturns = _.fromPairs(periods.map(period => [period, _.min(periodReturns[period])]))

    // add scores for colours
    summary.forEach(row => {
        row.scores = _.fromPairs(Object.entries(row.returns).map(([period, ret]) => {
            let score = 0
            if (ret > 0) {
                score = ret / maxReturns[period]
            } else if (ret < 0) {
                score = -ret / minReturns[period]
            }
            return [period, score]
        }))
    })
    return summary
}
