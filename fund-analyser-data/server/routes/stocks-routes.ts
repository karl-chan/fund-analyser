import { Promise } from 'bluebird'
import { Context } from 'koa'
import Router from 'koa-router'
import * as compute from '../../client/compute'
import * as StockDAO from '../../lib/db/StockDAO'
import FreeRealTime from '../../lib/stock/FreeRealTime'
import * as agGridUtils from '../../lib/util/agGridUtils'
import * as stockCache from '../cache/stockCache'
const JSONStream = require('JSONStream')
const STOCKS_URL_PREFIX = '/api/stocks'

const router = new Router({
  prefix: STOCKS_URL_PREFIX
})

const freeRealTime = new FreeRealTime()

router.get('/symbols/:symbols', async (ctx: Context) => {
  const symbols = ctx.params.symbols.split(',')
  const options: StockDAO.Options = {
    query: { symbol: { $in: symbols } },
    projection: { _id: 0 }
  }
  const stocks = await StockDAO.listStocks(options)
  ctx.body = stocks
})

router.post('/stream', async (ctx: Context) => {
  const { symbols } = ctx.request.body
  const options: StockDAO.Options = symbols
    ? {
        query: { symbol: { $in: symbols } },
        projection: { _id: 0 }
      }
    : {
        projection: { _id: 0 }
      }
  ctx.body = StockDAO.streamStocks(options)
    .on('error', ctx.onerror)
    .pipe(JSONStream.stringify())
})

router.get('/real-time-details/:symbols', async (ctx: Context) => {
  const symbols = ctx.params.symbols.split(',')
  const options = {
    query: { symbol: { $in: symbols } }
  }
  const stocks = await StockDAO.listStocks(options)
  const realTimeDetailsPairs = await Promise.map(stocks, async (s: any) => {
    const { realTimeDetails } = await freeRealTime.getSummary(s.symbol)
    return [s.symbol, realTimeDetails]
  })
  ctx.body = realTimeDetailsPairs
})

router.get('/search/:searchText', async (ctx: Context) => {
  const searchText = ctx.params.searchText
  const projection = { _id: 0, symbol: 1, name: 1 }
  const limit = 25
  const searchResults = await StockDAO.search(searchText, projection, limit)
  ctx.body = searchResults
})

router.get('/summary', async (ctx: Context) => {
  const options = {
    projection: { _id: 0, historicPrices: 0 }
  }
  const stocks = await StockDAO.listStocks(options)
  ctx.body = stocks
})

router.post('/list', async (ctx: Context) => {
  const { symbols, params } = ctx.request.body
  let stocks = stockCache.get(symbols, params)
  const { asof, stats, totalStocks } = stockCache.getMetadata(params)
  let lastRow = totalStocks
  if (params && params.agGridRequest) {
    ({ rows: stocks, lastRow } = agGridUtils.applyRequest(stocks, params.agGridRequest))
  }
  ctx.body = {
    stocks,
    metadata: { lastRow, totalStocks, asof, stats }
  }
})

router.get('/indicators', async (ctx: Context) => {
  ctx.body = await compute.get('indicators/stock')
})

export default router
