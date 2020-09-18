module.exports = {
    calcReturns,
    calcIndicators,
    calcStats,
    enrichSummary
}

const Stock = require('../stock/Stock')
const fundUtils = require('./fundUtils')
const indicators = require('./indicators')
const properties = require('./properties')

const lookbacks = properties.get('stock.lookbacks')

function calcReturns (historicPrices) {
    return fundUtils.enrichReturns({}, historicPrices, lookbacks)
}

async function calcIndicators (stock) {
    return indicators.calcStockIndicators(stock)
}

function calcStats (stocks) {
    return fundUtils.calcStats(stocks, Stock.schema)
}

function enrichSummary (summary) {
    return fundUtils.enrichSummary(summary)
}
