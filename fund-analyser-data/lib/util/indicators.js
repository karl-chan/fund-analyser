module.exports = {
    calcIndicators,
    calcMacd,
    calcMdd,
    calcReturns,
    calcStability
}

const _ = require('lodash')
const ta = require('technicalindicators')
const properties = require('./properties')
const fundUtils = require('./fundUtils')

const lookbacks = properties.get('fund.lookbacks')

function calcIndicators (historicPrices) {
    return {
        stability: calcStability(historicPrices),
        macd: calcMacd(historicPrices),
        mdd: calcMdd(historicPrices),
        returns: calcReturns(historicPrices)
    }
}

function calcMacd (historicPrices) {
    if (_.isEmpty(historicPrices)) {
        return NaN
    }
    const options = {
        values: historicPrices.map(e => e.price),
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false, // EMA
        SimpleMASignal: false // EMA
    }
    const macd = ta.MACD.calculate(options)
    return _.get(_.last(macd), 'histogram', NaN)
}

// TODO: backtesting platform
// decurrency
// equity curve
// Maximum drawdown risk
// empirical probability distribution
function calcMdd (historicPrices) {
    if (_.isEmpty(historicPrices)) {
        return NaN
    }
    let maxDrawdown = 0
    let mostRecentPeak = historicPrices[0].price
    let cumulativeDown = 0
    for (let i = 0; i < historicPrices.length - 1; i++) {
        const first = historicPrices[i]
        const second = historicPrices[i + 1]
        if (first.price < second.price) {
            // increasing
            maxDrawdown = Math.max(maxDrawdown, cumulativeDown / mostRecentPeak)
            mostRecentPeak = second.price
            cumulativeDown = 0
        } else if (first.price >= second.price) {
            // decreasing
            cumulativeDown += (first.price - second.price)
        }
    }
    return Math.max(maxDrawdown, cumulativeDown / mostRecentPeak)
}

function calcStability (historicPrices) {
    if (_.isEmpty(historicPrices) || historicPrices.length < 2) {
        return NaN
    }
    let trendyDays = []
    let sign = 0
    let currTrendDays = 0
    for (let i = 0; i < historicPrices.length - 1; i++) {
        const first = historicPrices[i]
        const second = historicPrices[i + 1]
        currTrendDays++
        const turningPoint =
                (sign < 0 && first.price < second.price) || // trough
                (sign > 0 && first.price > second.price) // peak
        if (turningPoint) {
            trendyDays.push(currTrendDays)
            currTrendDays = 0
        }
        if (first.price < second.price) {
            sign = 1 // increasing
        } else if (first.price > second.price) {
            sign = -1 // decreasing
        }
    }
    currTrendDays++
    trendyDays.push(currTrendDays)
    return _.mean(trendyDays)
}

function calcReturns (historicPrices) {
    const returns = {}
    for (let period of lookbacks) {
        const prevRecord = fundUtils.closestRecord(period, historicPrices)
        if (_.isNil(prevRecord)) {
            returns[period] = { min: null, max: null }
            continue
        }
        const prevIndex = historicPrices.findIndex(hp => hp.date.getTime() === prevRecord.date.getTime())
        let min = +Infinity; let max = -Infinity
        for (let i = historicPrices.length - 1, j = prevIndex; j >= 0; i--, j--) {
            const [currPrice, prevPrice] = [historicPrices[i].price, historicPrices[j].price]
            const periodReturns = (currPrice - prevPrice) / prevPrice
            min = Math.min(min, periodReturns)
            max = Math.max(max, periodReturns)
        }
        returns[period] = { min, max }
    }
    return returns
}
