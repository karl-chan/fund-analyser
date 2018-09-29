module.exports = createIndex

const db = require('../../lib/util/db')
const log = require('../../lib/util/log')
const Promise = require('bluebird')

/**
 * Create index on popular fields for sorting
 */
async function createIndex () {
    await Promise.all([createFundsIndex(), createCurrencyIndex()])
}

async function createFundsIndex () {
    await Promise.map(db.getFunds(), async fundDb => {
        try {
            await fundDb.dropIndexes()
        } catch (ignored) {}
    })
    log.info('Dropped fund indexes')

    const periods = ['1D', '3D', '1W', '2W', '1M', '3M', '6M', '1Y', '3Y', '5Y']
    for (let period of periods) {
        await Promise.map(db.getFunds(), fundDb => fundDb.createIndex({ [`returns.${period}`]: 1 }, { background: true }))
    }
    const columns = ['isin', 'asof']
    for (let col of columns) {
        await Promise.map(db.getFunds(), fundDb => fundDb.createIndex({ [col]: 1 }, { background: true }))
    }
    // text index for searching
    await Promise.map(
        db.getFunds(),
        fundDb => fundDb.createIndex(
            { isin: 'text', sedol: 'text', name: 'text', 'holdings.name': 'text', 'holdings.symbol': 'text' },
            { background: true, weights: { name: 10, isin: 5, sedol: 5, 'holdings.name': 1, 'holdings.symbol': 1 } })
    )
    log.info('Created fund indexes')
}

async function createCurrencyIndex () {
    try {
        await db.getCurrencies().dropIndexes()
    } catch (ignored) {}
    log.info('Dropped currency indexes')

    await db.getCurrencies().createIndex({ quote: 1 }, { background: true })
    log.info('Created currency indexes')
}
