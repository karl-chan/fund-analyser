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
        'returns.1W', 'returns.3D', 'returns.1D', 'returns.+1D', 'indicators.stability', 'indicators.macd', 'indicators.mdd', 'asof']

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

    const min = keyValuesToFund(columns.map(col => [col, stat.min(getColumnValues(col))]))
    const q1 = keyValuesToFund(columns.map(col => [col, stat.q1(getColumnValues(col))]))
    const median = keyValuesToFund(columns.map(col => [col, stat.median(getColumnValues(col))]))
    const q3 = keyValuesToFund(columns.map(col => [col, stat.q3(getColumnValues(col))]))
    const max = keyValuesToFund(columns.map(col => [col, stat.max(getColumnValues(col))]))
    return { min, q1, median, q3, max }
}

function enrichRealTimeDetails (realTimeDetails, fund) {
    // excluding nulls
    const holdingsX = realTimeDetails.holdings
        .filter(h => h.todaysChange != null)
        .map(h => [h.weight, h.todaysChange])
    const estChange = stat.weightedMean(holdingsX)
    const stdev = stat.weightedStd(holdingsX)
    const ci = stat.ci95(estChange, stdev, holdingsX.length)

    const latestPrice = _.get(_.last(fund.historicPrices), 'price')
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

    // add colours to returns
    const periods = ['returns.5Y', 'returns.3Y', 'returns.1Y', 'retfurns.6M', 'returns.3M',
        'returns.1M', 'returns.2W', 'returns.1W', 'returns.3D', 'returns.1D', 'returns.+1D']
    const periodToReturns = _.fromPairs(periods.map(period => [period, summary.map(row => _.get(row, period))]))
    const maxReturns = _.fromPairs(periods.map(period => [period, stat.max(periodToReturns[period])]))
    const minReturns = _.fromPairs(periods.map(period => [period, stat.min(periodToReturns[period])]))

    const medianStability = stat.median(summary.map(row => _.get(row, 'indicators.stability')))
    const maxStability = 10 // not interested in anything above 10
    const minStability = stat.min(summary.map(row => _.get(row, 'indicators.stability')))
    const maxMacd = stat.max(summary.map(row => _.get(row, 'indicators.macd')))
    const minMacd = stat.min(summary.map(row => _.get(row, 'indicators.macd')))
    const maxMdd = stat.max(summary.map(row => _.get(row, 'indicators.mdd')))

    // add scores for colours
    summary
        .forEach(row => {
            const returns = row.returns
                ? _.fromPairs(Object.entries(row.returns).map(([period, ret]) => {
                    let score = ret > 0 ? ret / maxReturns[`returns.${period}`]
                        : (ret < 0 ? -ret / minReturns[`returns.${period}`] : 0)
                    return [period, score]
                })) : {}

            const indicators = row.indicators ? {
                stability: row.indicators.stability > medianStability ? Math.min(1.5, (row.indicators.stability - medianStability) / (maxStability - medianStability))
                    : (row.indicators.stability < medianStability ? (row.indicators.stability - medianStability) / (medianStability - minStability) : 0),
                macd: row.indicators.macd > 0 ? row.indicators.macd / maxMacd
                    : (row.indicators.macd < 0 ? -row.indicators.macd / minMacd : 0),
                mdd: -row.indicators.mdd / maxMdd
            } : {}

            row.scores = {
                returns,
                indicators
            }
        })
    return summary
}
