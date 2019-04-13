module.exports = {
    calcIndicators
}

const compute = require('../../client/compute')

async function calcIndicators (historicPrices) {
    return compute.post('indicators', historicPrices)
}
