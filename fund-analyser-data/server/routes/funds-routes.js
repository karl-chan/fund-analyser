const Router = require('koa-router')
const moment = require('moment')
const agGrid = require('../../lib/util/agGrid')
const fundCache = require('../cache/fundCache')
const FinancialTimes = require('../../lib/fund/FinancialTimes')
const FundDAO = require('../../lib/db/FundDAO')

const FUNDS_URL_PREFIX = '/api/funds'
const router = new Router({
    prefix: FUNDS_URL_PREFIX
})

router.get('/isins/:isins', async ctx => {
    const isins = ctx.params.isins.split(',')
    const options = {
        query: {isin: {$in: isins}},
        projection: {_id: 0}
    }
    const funds = await FundDAO.listFunds(options)
    ctx.body = funds
})

router.get('/real-time-details/:isin', async ctx => {
    const options = {
        query: {isin: ctx.params.isin}
    }
    const funds = await FundDAO.listFunds(options)
    const details = await new FinancialTimes().getRealTimeDetails(funds[0])
    ctx.body = details
})

router.get('/search/:searchText', async ctx => {
    const searchText = ctx.params.searchText
    const projection = {_id: 0, isin: 1, sedol: 1, name: 1}
    const limit = 25
    const searchResults = await FundDAO.search(searchText, projection, limit)
    ctx.body = searchResults
})

router.get('/summary', async ctx => {
    const options = {
        projection: { _id: 0, historicPrices: 0 }
    }
    const funds = await FundDAO.listFunds(options)
    ctx.body = funds
})

router.post('/list', async ctx => {
    const {isins, params} = ctx.request.body
    const funds = fundCache.get(isins, {filterText: params.filterText})
    const {asof, stats, totalFunds} = fundCache.getMetadata()
    const {funds: window, lastRow} = agGrid.applyParams(funds, params.agGridRequest)
    ctx.body = {
        funds: window,
        metadata: { lastRow, totalFunds, asof, stats }
    }
})

router.get('/csv', async ctx => {
    const options = {
        projection: { _id: 0, historicPrices: 0 }
    }
    const headerFields = ['isin', 'name', 'type', 'shareClass', 'frequency',
        'ocf', 'amc', 'entryCharge', 'exitCharge', 'bidAskSpread', 'returns.5Y', 'returns.3Y',
        'returns.1Y', 'returns.6M', 'returns.3M', 'returns.1M', 'returns.2W',
        'returns.1W', 'returns.3D', 'returns.1D', 'indicators.stability', 'holdings', 'asof']
    ctx.body = FundDAO.exportCsv(headerFields, options)
    ctx.set('Content-disposition', `attachment;filename=fund_${moment().format('YYYYMMDD')}.csv`)
    ctx.set('Content-type', 'text/csv')
})

module.exports = router
