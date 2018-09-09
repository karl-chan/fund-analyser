module.exports = {
    invertCurrency,
    multiplyCurrencies
}

const Currency = require('../currency/Currency')
const _ = require('lodash')

function invertCurrency (currency) {
    const invertedRates = currency.historicRates.map(hr => new Currency.HistoricRate(hr.date, 1 / hr.rate))
    return new Currency(currency.quote, currency.base, invertedRates)
}

function multiplyCurrencies (currency1, currency2) {
    if (currency1.quote !== currency2.base) {
        throw new Error('currency1.quote must === currency2.base for multiplication to happen!')
    }

    let multipliedRates = []
    let firstPtr = 0; let secondPtr = 0
    while (firstPtr < currency1.historicRates.length && secondPtr < currency2.historicRates.length) {
        let {date: firstDate, rate: firstRate} = currency1.historicRates[firstPtr]
        let {date: secondDate, rate: secondRate} = currency2.historicRates[secondPtr]
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
    return new Currency(currency1.base, currency2.quote, multipliedRates)
}
