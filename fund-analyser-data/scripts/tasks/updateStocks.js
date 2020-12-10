module.exports = updateStocks

const StockFactory = require('../../lib/stock/StockFactory')
const StockDAO = require('../../lib/db/StockDAO')
const streamWrapper = require('../../lib/util/streamWrapper')
const lang = require('../../lib/util/lang')
const log = require('../../lib/util/log')

const Promise = require('bluebird')
const WikipediaStocks = require('../../lib/stock/WikipediaStocks')

/**
 * Update stocks that need to be updated based on asof time
 * @returns {Promise.<void>}
 */
async function updateStocks () {
    const allSymbols = await new WikipediaStocks().getSymbols()

    const docs = await StockDAO.listStocks({ projection: { symbol: 1, asof: 1 } })
    const oldSymbols = docs.map(s => s.symbol)

    const deleteSymbols = lang.setDifference(oldSymbols, allSymbols)
    await StockDAO.deleteStocks({ query: { symbol: { $in: deleteSymbols } } })
    log.info('Deleted old symbols: %s (%d)', JSON.stringify(deleteSymbols), deleteSymbols.length)

    log.info('Symbols to update: %s (%d)', JSON.stringify(allSymbols), allSymbols.length)

    const stockStream = new StockFactory().streamStocksFromSymbols(allSymbols)
    const stockValidFilter = streamWrapper.asFilterAsync(isStockValid)
    const upsertStockStream = streamWrapper.asWritableAsync(async stock => {
        await StockDAO.upsertStocks([stock])
    })

    await new Promise((resolve, reject) => {
        const stream = stockStream
            .pipe(stockValidFilter)
            .pipe(upsertStockStream)
        stream.on('finish', () => {
            log.info('Finished updating stocks')
            resolve()
        })
        stream.on('error', (err) => {
            log.error('Fatal error, aborting updateStocks: %s', err.stack)
            reject(err)
        })
    })

    // delete stocks with no data
    await StockDAO.deleteStocks({ query: { name: { $eq: null } } })
    log.info('Deleted stocks without names')
}

async function isStockValid (stock) {
    if (!stock.isValid()) {
        log.warn('Stock is not valid: %j. Skipping upsert.', stock)
        return false
    }
    log.silly('Stock is valid: %s', stock.isin)
    return true
}
