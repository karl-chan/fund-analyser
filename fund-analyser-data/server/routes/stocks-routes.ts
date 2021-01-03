import { Promise } from 'bluebird'
import Router from 'koa-router'
import * as compute from '../../client/compute'
import * as StockDAO from '../../lib/db/StockDAO'
import MarketWatch from '../../lib/stock/MarketWatch'
import * as agGridUtils from '../../lib/util/agGridUtils'
import * as stockCache from '../cache/stockCache'
const JSONStream = require('JSONStream')
const STOCKS_URL_PREFIX = '/api/stocks'

const router = new Router({
  prefix: STOCKS_URL_PREFIX
})

const marketWatch = new MarketWatch()

router.get('/symbols/:symbols', async (ctx: any) => {
  const symbols = ctx.params.symbols.split(',')
  const { stream } = ctx.query
  const options = {
    query: { symbol: { $in: symbols } },
    projection: { _id: 0 }
  }
  if (stream) {
    // support "all" only in stream mode to be memory friendly
    if (ctx.params.symbols === 'all') {
      // @ts-expect-error ts-migrate(2741) FIXME: Property 'symbol' is missing in type '{}' but requ... Remove this comment to see the full error message
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

router.get('/real-time-details/:symbols', async (ctx: any) => {
  const symbols = ctx.params.symbols.split(',')
  const options = {
    query: { symbol: { $in: symbols } }
  }
  const stocks = await StockDAO.listStocks(options)
  const realTimeDetailsPairs = await (Promise as any).map(stocks, async (s: any) => {
    const { realTimeDetails } = await marketWatch.getSummary(s.symbol)
    return [s.symbol, realTimeDetails]
  })
  ctx.body = realTimeDetailsPairs
})
router.get('/search/:searchText', async (ctx: any) => {
  const searchText = ctx.params.searchText
  const projection = { _id: 0, symbol: 1, name: 1 }
  const limit = 25
  const searchResults = await StockDAO.search(searchText, projection, limit)
  ctx.body = searchResults
})

router.get('/summary', async (ctx: any) => {
  const options = {
    projection: { _id: 0, historicPrices: 0 }
  }
  const stocks = await StockDAO.listStocks(options)
  ctx.body = stocks
})

router.post('/list', async (ctx: any) => {
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

router.get('/indicators', async (ctx: any) => {
  ctx.body = await compute.get('indicators/stock')
})

export default router
