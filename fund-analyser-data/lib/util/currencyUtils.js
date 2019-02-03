module.exports = {
    invertCurrency,
    multiplyCurrencies,
    calculateReturns
}

const Currency = require('../currency/Currency')
const fundUtils = require('../util/fundUtils')
const properties = require('../util/properties')
const _ = require('lodash')

const lookbacks = properties.get('fund.lookbacks')

function invertCurrency (currency) {
    const invertedRates = currency.historicRates.map(hr => new Currency.HistoricRate(hr.date, 1 / hr.rate))
    const returns = calculateReturns(invertedRates, lookbacks)
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
    const returns = calculateReturns(multipliedRates, lookbacks)
    return new Currency(currency1.base, currency2.quote, multipliedRates, returns)
}

function calculateReturns (historicRates) {
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
