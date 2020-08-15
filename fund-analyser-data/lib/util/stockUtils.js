module.exports = {
    calcReturns,
    calcIndicators
}

const Fund = require('../fund/Fund')
const fundUtils = require('./fundUtils')
const indicators = require('./indicators')
const properties = require('./properties')

const lookbacks = properties.get('stock.lookbacks')

function calcReturns (historicPrices) {
    const historicPricesSeries = historicPrices.map(hp => new Fund.HistoricPrice(hp.date, hp.close))
    return fundUtils.enrichReturns({}, historicPricesSeries, lookbacks)
}

async function calcIndicators (stock) {
    return indicators.calcStockIndicators(stock)
}
