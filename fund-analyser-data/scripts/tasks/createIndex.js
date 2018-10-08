module.exports = createIndex

const db = require('../../lib/util/db')
const log = require('../../lib/util/log')
const properties = require('../../lib/util/properties')
const Promise = require('bluebird')

const lookbacks = properties.get('fund.lookbacks')

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

    for (let period of lookbacks) {
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
