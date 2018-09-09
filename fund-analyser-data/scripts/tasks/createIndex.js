module.exports = createIndex

const db = require('../../lib/util/db')

/**
 * Create index on popular fields for sorting
 */
async function createIndex () {
    await Promise.all([createFundsIndex(), createCurrencyIndex()])
}

async function createFundsIndex () {
    await db.getFunds().dropIndexes()
    const periods = ['1D', '3D', '1W', '2W', '1M', '3M', '6M', '1Y', '3Y', '5Y']
    for (let period of periods) {
        await db.getFunds().createIndex({ [`returns.${period}`]: 1 }, { background: true })
    }
    const columns = ['isin', 'asof']
    for (let col of columns) {
        await db.getFunds().createIndex({ [col]: 1 }, { background: true })
    }
    // text index for searching
    await db.getFunds().createIndex(
        { isin: 'text', sedol: 'text', name: 'text', 'holdings.name': 'text', 'holdings.symbol': 'text' },
        { background: true, weights: { name: 10, isin: 5, sedol: 5, 'holdings.name': 1, 'holdings.symbol': 1 } }
    )
}

async function createCurrencyIndex () {
    await db.getCurrencies().dropIndexes()
    await db.getCurrencies().createIndex({ quote: 1 }, { background: true })
}
