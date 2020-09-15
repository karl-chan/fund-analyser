const Router = require('koa-router')
const JSONStream = require('JSONStream')
const compute = require('../../client/compute')
const StockDAO = require('../../lib/db/StockDAO')
const agGridUtils = require('../../lib/util/agGridUtils')
const stockCache = require('../cache/stockCache')

const STOCKS_URL_PREFIX = '/api/stocks'
const router = new Router({
    prefix: STOCKS_URL_PREFIX
})

router.get('/symbols/:symbols', async ctx => {
    const symbols = ctx.params.symbols.split(',')
    const { stream } = ctx.query
    const options = {
        query: { symbol: { $in: symbols } },
        projection: { _id: 0 }
    }
    if (stream) {
        // support "all" only in stream mode to be memory friendly
        if (ctx.params.symbols === 'all') {
            options.query = {}
        }
        ctx.type = 'json'
        ctx.body = StockDAO.streamStocks(options)
            .on('error', ctx.onerror)
            .pipe(JSONStream.stringify())
    } else {
        const stocks = await StockDAO.listStocks(options)
        ctx.body = stocks
    }
})

router.get('/search/:searchText', async ctx => {
    const searchText = ctx.params.searchText
    const projection = { _id: 0, symbol: 1, name: 1 }
    const limit = 25
    const searchResults = await StockDAO.search(searchText, projection, limit)
    ctx.body = searchResults
})

router.get('/summary', async ctx => {
    const options = {
        projection: { _id: 0, historicPrices: 0 }
    }
    const stocks = await StockDAO.listStocks(options)
    ctx.body = stocks
})

router.post('/list', async ctx => {
    const { isins, params } = ctx.request.body
    let stocks = stockCache.get(isins, params)
    const { asof, stats, totalStocks } = stockCache.getMetadata(params)
    let lastRow = totalStocks
    if (params && params.agGridRequest) {
        ({ funds: stocks, lastRow } = agGridUtils.applyRequest(stocks, params.agGridRequest))
    }
    ctx.body = {
        stocks,
        metadata: { lastRow, totalStocks, asof, stats }
    }
})

router.get('/indicators', async ctx => {
    ctx.body = await compute.get('indicators/stock')
})

module.exports = router
