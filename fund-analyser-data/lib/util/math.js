module.exports = {
    pcToFloat,
    floatToPc,
    enrichReturns,
    calcPercentiles,
    calcStability,
    closestRecord,
    enrichRealTimeDetails,
    enrichSummary
}

const _ = require('lodash')
const moment = require('moment')
const jStat = require('jStat').jStat

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

function calcStability (historicPrices) {
    if (_.isEmpty(historicPrices) || historicPrices.length < 2) {
        return NaN
    }
    let sum = 0
    let sign = 1
    for (let i = 0; i < historicPrices.length - 1; i++) {
        const first = historicPrices[i]
        const second = historicPrices[i + 1]
        if (first.price <= second.price) {
            // increasing
            if (sign === 1) {
                sum += 1
            }
            sign = 1
        } else if (first.price > second.price) {
            // decreasing
            if (sign === -1) {
                sum += 1
            }
            sign = -1
        }
    }
    const stability = sum / (historicPrices.length - 1)
    return stability
}

function enrichRealTimeDetails (realTimeDetails) {
    // excluding nulls
    const holdingsX = realTimeDetails.holdings.filter(h => h.todaysChange != null)
    const changesX = holdingsX.map(h => h.todaysChange)
    const estChange = _.sumBy(holdingsX, h => h.todaysChange * h.weight) /
        _.sumBy(holdingsX, h => h.weight)
    const stdev = jStat.stdev(changesX, true) || null
    const ci = jStat.tci(estChange, 0.05, changesX)

    const enrichment = { estChange, stdev, ci }
    return {...enrichment, ...realTimeDetails}
}

function enrichSummary (summary) {
    const periods = Object.keys(summary[0].returns)
    const periodReturns = _.fromPairs(periods.map(period => [period, summary.map(row => row.returns[period])]))
    const maxReturns = _.fromPairs(periods.map(period => [period, _.max(periodReturns[period])]))
    const minReturns = _.fromPairs(periods.map(period => [period, _.min(periodReturns[period])]))

    const enrichedSummary = summary.map(row => {
        const scores = _.fromPairs(Object.entries(row.returns).map(([period, ret]) => {
            const score = ret > 0 ? ret / maxReturns[period] : (ret < 0 ? -ret / minReturns[period] : ret)
            return [period, score]
        }))
        const metadata = {scores}
        return {...row, ...metadata}
    })
    return enrichedSummary
}
