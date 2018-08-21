module.exports = {
    calcMacd,
    calcStability
}

const _ = require('lodash')
const ta = require('technicalindicators')

function calcMacd (historicPrices) {
    if (!historicPrices) {
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
