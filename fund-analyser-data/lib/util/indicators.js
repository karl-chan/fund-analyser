module.exports = {
    calcFundIndicators,
    calcStockIndicators
}

const compute = require('../../client/compute')

async function calcFundIndicators (fund) {
    const { historicPrices, ...restFund } = fund
    return compute.post('indicators/fund', {
        fund: restFund,
        historicPrices
    })
}

async function calcStockIndicators (stock) {
    const { historicPrices, ...restStock } = stock
    return compute.post('indicators/stock', {
        stock: restStock,
        historicPrices
    })
}
