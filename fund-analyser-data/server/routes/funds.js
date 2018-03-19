const Router = require('koa-router')
const db = require('../../lib/util/db')
const FinancialTimes = require('../../lib/fund/FinancialTimes')

const router = new Router()
const BASE_URL = '/api/funds'

router.get(`${BASE_URL}/get/:isin`, async ctx => {
    const query = {isin: ctx.params.isin}
    const options = {
        projection: {_id: 0}
    }
    const fund = await db.getFunds().findOne(query, options)
    ctx.body = fund
})

router.get(`${BASE_URL}/get/real-time-details/:isin`, async ctx => {
    const query = {isin: ctx.params.isin}
    const options = {
        projection: {_id: 0}
    }
    const fund = await db.getFunds().findOne(query, options)    
    details = await new FinancialTimes().getRealTimeDetails(fund)
    ctx.body = details
})

router.get(`${BASE_URL}/search/:searchText`, async ctx => {
    const searchText = ctx.params.searchText
    const query = {$text: {$search: searchText}}
    const options = {
        projection: {_id: 0, isin: 1, sedol: 1, name: 1, score: {$meta: 'textScore'}},
        sort: {score: {$meta: 'textScore'}},
        limit: 25
    }
    const searchResults = await db.getFunds().find(query, options).toArray()
    ctx.body = searchResults;
})

router.get(`${BASE_URL}/summary`, async ctx => {
    const query = {}
    const options = {
        projection: {_id: 0, historicPrices: 0, percentiles: 0}
    }
    const funds = await db.getFunds().find(query, options).toArray()
    ctx.set('Cache-Control', 'max-age=3600')
    ctx.body = funds
})

module.exports = router