module.exports = {
    calcIndicators
}

const compute = require('../../client/compute')

async function calcIndicators (fund) {
    const { historicPrices, ...restFund } = fund
    return compute.post('indicators', {
        fund: restFund,
        historicPrices
    })
}
