const Router = require('koa-router')
const moment = require('moment')
const csv = require('../../lib/util/csv')
const db = require('../../lib/util/db')
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
    const query = {isin: {$in: isins}}
    const options = {
        projection: {_id: 0}
    }
    const funds = await db.getFunds().find(query, options).toArray()
    ctx.body = funds
})

router.get('/real-time-details/:isin', async ctx => {
    const query = {isin: ctx.params.isin}
    const options = {}
    const fund = await db.getFunds().findOne(query, options)
    const details = await new FinancialTimes().getRealTimeDetails(fund)
    ctx.body = details
})

router.get('/search/:searchText', async ctx => {
    const searchText = ctx.params.searchText
    const query = {$text: {$search: searchText}}
    const options = {
        projection: {_id: 0, isin: 1, sedol: 1, name: 1, score: {$meta: 'textScore'}},
        sort: {score: {$meta: 'textScore'}},
        limit: 25
    }
    const searchResults = await db.getFunds().find(query, options).toArray()
    ctx.body = searchResults
})

router.get('/summary', async ctx => {
    const query = {}
    const options = {
        projection: { _id: 0, historicPrices: 0, percentiles: 0 }
    }
    const funds = await db.getFunds().find(query, options).toArray()
    ctx.body = funds
})

router.post('/list', async ctx => {
    const {isins, params} = ctx.request.body
    const funds = fundCache.get(isins, {filterText: params.filterText})
    const {asof, stats} = fundCache.getMetadata()
    const {funds: showFunds, lastRow} = agGrid.applyParams(funds, params.agGridRequest)
    ctx.body = {
        funds: showFunds,
        metadata: { lastRow, asof, stats }
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
    ctx.body = FundDAO.streamCsv(headerFields, options)
    ctx.set('Content-disposition', `attachment;filename=fund_${moment().format('YYYYMMDD')}.csv`)
    ctx.set('Content-type', 'text/csv')
})

module.exports = router
