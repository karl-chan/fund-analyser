const Router = require('koa-router')
const db = require('../../lib/util/db')
const agGrid = require('../../lib/util/agGrid')
const fundCache = require('../cache/fund-cache')
const FinancialTimes = require('../../lib/fund/FinancialTimes')

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

module.exports = router
