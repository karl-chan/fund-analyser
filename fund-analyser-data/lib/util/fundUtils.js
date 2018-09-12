module.exports = {
    enrichReturns,
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

function calcIndicators (historicPrices) {
    return indicators.calcIndicators(historicPrices)
}

function calcStats (funds) {
    if (!funds.length) {
        return undefined
    }
    const columns = ['ocf', 'amc', 'entryCharge', 'exitCharge', 'bidAskSpread', 'returns.5Y', 'returns.3Y',
        'returns.1Y', 'returns.6M', 'returns.3M', 'returns.1M', 'returns.2W',
        'returns.1W', 'returns.3D', 'returns.1D', 'returns.+1D', 'indicators.stability', 'asof']

    const getColumnValues = col => {
        return funds.map(f => _.get(f, col))
    }
    const keyValuesToFund = keyValuePairs => {
        const fund = {}
        for (let [key, value] of keyValuePairs) {
            _.set(fund, key, value)
        }
        return fund
    }

    const max = keyValuesToFund(columns.map(col => [col, stat.max(getColumnValues(col))]))
    const min = keyValuesToFund(columns.map(col => [col, stat.min(getColumnValues(col))]))
    const median = keyValuesToFund(columns.map(col => [col, stat.median(getColumnValues(col))]))
    return { max, min, median }
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
    summary
        .filter(row => row.returns)
        .forEach(row => {
            row.returns['+1D'] = row.realTimeDetails ? row.realTimeDetails.estChange : NaN
        })

    const rowWithReturns = summary.find(row => row.returns)
    if (rowWithReturns) {
        const periods = Object.keys(rowWithReturns.returns)
        const periodReturns = _.fromPairs(periods.map(period => [period, summary.map(row => row.returns && row.returns[period])]))
        const maxReturns = _.fromPairs(periods.map(period => [period, _.max(periodReturns[period])]))
        const minReturns = _.fromPairs(periods.map(period => [period, _.min(periodReturns[period])]))

        // add scores for colours
        summary
            .filter(row => row.returns)
            .forEach(row => {
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
    }
    return summary
}
