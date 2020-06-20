module.exports = updateStocks

const StockFactory = require('../../lib/stock/StockFactory')
const StockDAO = require('../../lib/db/StockDAO')
const streamWrapper = require('../../lib/util/streamWrapper')
const lang = require('../../lib/util/lang')
const log = require('../../lib/util/log')

const moment = require('moment')
const Promise = require('bluebird')
const MarketsInsider = require('../../lib/stock/MarketsInsider')

/**
 * Update stocks that need to be updated based on asof time
 * @returns {Promise.<void>}
 */
async function updateStocks () {
    const today = moment().utc().startOf('day').toDate()

    const allSymbols = await new MarketsInsider().getSymbols()

    const stocksUpToDate = await StockDAO.listStocks({
        query: { asof: { $eq: today } },
        projection: { symbol: 1 },
        sort: { asof: 1 }
    })
    const symbolsUpToDate = stocksUpToDate.map(f => f.symbol)

    const symbols = lang.setDifference(allSymbols, symbolsUpToDate)
    log.info('Symbols to update: %s (%d)', JSON.stringify(symbols), symbols.length)

    const stockStream = new StockFactory().streamStocksFromSymbols(symbols)
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
