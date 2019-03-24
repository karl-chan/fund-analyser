module.exports = {
    invertCurrency,
    multiplyCurrencies,
    calcReturns,
    calcStats,
    enrichSummary
}

const Currency = require('../currency/Currency')
const fundUtils = require('./fundUtils')
const agGridUtils = require('./agGridUtils')
const lang = require('./lang')
const stat = require('./stat')
const properties = require('./properties')
const _ = require('lodash')

const lookbacks = properties.get('fund.lookbacks')

function invertCurrency (currency) {
    const invertedRates = currency.historicRates.map(hr => new Currency.HistoricRate(hr.date, 1 / hr.rate))
    const returns = calcReturns(invertedRates, lookbacks)
    return new Currency(currency.quote, currency.base, invertedRates, returns)
}

function multiplyCurrencies (currency1, currency2) {
    if (currency1.quote !== currency2.base) {
        throw new Error('currency1.quote must === currency2.base for multiplication to happen!')
    }

    let multipliedRates = []
    let firstPtr = 0; let secondPtr = 0
    while (firstPtr < currency1.historicRates.length && secondPtr < currency2.historicRates.length) {
        let { date: firstDate, rate: firstRate } = currency1.historicRates[firstPtr]
        let { date: secondDate, rate: secondRate } = currency2.historicRates[secondPtr]
        if (firstDate.getTime() === secondDate.getTime()) {
            multipliedRates.push(new Currency.HistoricRate(firstDate, firstRate * secondRate))
            firstPtr++
            secondPtr++
        } else if (firstDate < secondDate) {
            secondRate = currency2.historicRates[Math.max(0, secondPtr - 1)].rate
            multipliedRates.push(new Currency.HistoricRate(firstDate, firstRate * secondRate))
            firstPtr++
        } else {
            firstRate = currency1.historicRates[Math.max(0, firstPtr - 1)].rate
            multipliedRates.push(new Currency.HistoricRate(secondDate, firstRate * secondRate))
            secondPtr++
        }
    }
    // add remaining tail
    let tail = []
    if (firstPtr < currency1.historicRates.length) {
        tail = currency1.historicRates
            .slice(firstPtr)
            .map(hr => new Currency.HistoricRate(hr.date, hr.rate * _.last(currency2.historicRates).rate))
    } else if (secondPtr < currency2.historicRates.length) {
        tail = currency2.historicRates
            .slice(secondPtr)
            .map(hr => new Currency.HistoricRate(hr.date, _.last(currency1.historicRates).rate * hr.rate))
    }
    multipliedRates = multipliedRates.concat(tail)
    const returns = calcReturns(multipliedRates, lookbacks)
    return new Currency(currency1.base, currency2.quote, multipliedRates, returns)
}

function calcReturns (historicRates) {
    // Null safe check
    const returns = {}
    if (_.isEmpty(historicRates) || _.isEmpty(lookbacks)) {
        return returns
    }

    const latestRate = _.last(historicRates).rate
    _.forEach(lookbacks, (lookback) => {
        const beginRecord = fundUtils.closestRecord(lookback, historicRates)
        if (_.isNil(beginRecord)) {
            returns[lookback] = null
        } else {
            const beginRate = beginRecord.rate
            returns[lookback] = (latestRate - beginRate) / beginRate
        }
    })
    return returns
}

function calcStats (currencies) {
    if (!currencies.length) {
        return undefined
    }

    const columns = lang.deepKeysSatisfying(Currency.schema, (k, v) => v === 'number' || v === 'Date')
    const colToValues = _.fromPairs(columns.map(col => {
        return [col, currencies.map(c => _.get(c, col))]
    }))

    const min = lang.pairsToDeepObject(columns.map(col => [col, stat.min(colToValues[col])]))
    const q1 = lang.pairsToDeepObject(columns.map(col => [col, stat.q1(colToValues[col])]))
    const median = lang.pairsToDeepObject(columns.map(col => [col, stat.median(colToValues[col])]))
    const q3 = lang.pairsToDeepObject(columns.map(col => [col, stat.q3(colToValues[col])]))
    const max = lang.pairsToDeepObject(columns.map(col => [col, stat.max(colToValues[col])]))
    return { min, q1, median, q3, max }
}

function enrichSummary (summary) {
    // add colours to retuns
    const { colourAroundZero, colourAroundMedian, colourNegative } = agGridUtils
    const colourOptions = {
        'returns.$lookback': [colourAroundZero],
        'returns.+1D': [colourAroundZero], // include +1D
        'indicators.stability': [colourAroundMedian, 10],
        'indicators.macd': [colourAroundZero],
        'indicators.mdd': [colourNegative],
        'indicators.returns.$lookback.max': [colourAroundZero],
        'indicators.returns.$lookback.min': [colourAroundZero]
    }
    summary = agGridUtils.addColours(summary, colourOptions)
    return summary
}
