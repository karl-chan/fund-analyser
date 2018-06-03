const Router = require('koa-router')
const db = require('../../lib/util/db')
const FinancialTimes = require('../../lib/fund/FinancialTimes')

const FUNDS_URL_PREFIX = '/api/funds'
const router = new Router({
    prefix: FUNDS_URL_PREFIX
})

router.get('/get/:isin', async ctx => {
    const query = {isin: ctx.params.isin}
    const options = {
        projection: {_id: 0}
    }
    const fund = await db.getFunds().findOne(query, options)
    ctx.body = fund
})

router.get('/get/real-time-details/:isin', async ctx => {
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
        projection: {
            _id: 0,
            historicPrices: 0,
            percentiles: 0,
            'realTimeDetails.estPrice': 0,
            'realTimeDetails.stdev': 0,
            'realTimeDetails.ci': 0,
            'realTimeDetails.holdings': 0
        }
    }
    const funds = await db.getFunds().find(query, options).toArray()
    ctx.body = funds
})

module.exports = router
