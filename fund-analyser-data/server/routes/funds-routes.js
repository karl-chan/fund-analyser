const _ = require('lodash')
const Router = require('koa-router')
const moment = require('moment')
const Promise = require('bluebird')
const JSONStream = require('JSONStream')
const compute = require('../../client/compute')
const agGridUtils = require('../../lib/util/agGridUtils')
const fundCache = require('../cache/fundCache')
const FinancialTimes = require('../../lib/fund/FinancialTimes')
const FundDAO = require('../../lib/db/FundDAO')
const SimilarFundsDAO = require('../../lib/db/SimilarFundsDAO')

const FUNDS_URL_PREFIX = '/api/funds'
const router = new Router({
    prefix: FUNDS_URL_PREFIX
})

const financialTimes = new FinancialTimes()

router.get('/isins', async ctx => {
    const options = {
        projection: { _id: 0, isin: 1 }
    }
    const funds = await FundDAO.listFunds(options)
    ctx.body = funds.map(f => f.isin)
})

router.get('/isins/:isins', async ctx => {
    const isins = ctx.params.isins.split(',')
    const { stream } = ctx.query
    const options = {
        query: { isin: { $in: isins } },
        projection: { _id: 0 }
    }
    if (stream) {
        // support "all" only in stream mode to be memory friendly
        if (ctx.params.isins === 'all') {
            options.query = {}
        }
        ctx.type = 'json'
        ctx.body = FundDAO.streamFunds(options)
            .on('error', ctx.onerror)
            .pipe(JSONStream.stringify())
    } else {
        const funds = await FundDAO.listFunds(options)
        ctx.body = funds
    }
})

router.get('/real-time-details/:isins', async ctx => {
    const isins = ctx.params.isins.split(',')
    const options = {
        query: { isin: { $in: isins } }
    }
    const funds = await FundDAO.listFunds(options)
    const realTimeDetailsPairs = await Promise.map(funds, async f => {
        return [f.isin, await financialTimes.getRealTimeDetails(f)]
    })
    ctx.body = realTimeDetailsPairs
})

router.get('/search/:searchText', async ctx => {
    const searchText = ctx.params.searchText
    const projection = { _id: 0, isin: 1, sedol: 1, name: 1 }
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
    const { isins, params } = ctx.request.body
    let funds = fundCache.get(isins, params)
    const { asof, stats, totalFunds } = fundCache.getMetadata(params)
    let lastRow = totalFunds
    if (params && params.agGridRequest) {
        ({ funds, lastRow } = agGridUtils.applyRequest(funds, params.agGridRequest))
    }
    ctx.body = {
        funds,
        metadata: { lastRow, totalFunds, asof, stats }
    }
})

router.get('/indicators', async ctx => {
    ctx.body = await compute.get('indicators')
})

router.get('/csv', async ctx => {
    const options = {
        projection: { _id: 0, historicPrices: 0 }
    }
    const headerFields = ['isin', 'name', 'type', 'shareClass', 'frequency',
        'ocf', 'amc', 'entryCharge', 'exitCharge', 'bidAskSpread', 'returns.5Y', 'returns.3Y',
        'returns.1Y', 'returns.6M', 'returns.3M', 'returns.1M', 'returns.2W',
        'returns.1W', 'returns.3D', 'returns.1D', 'indicators.stability.value', 'holdings', 'asof']
    ctx.body = FundDAO.exportCsv(headerFields, options)
    ctx.set('Content-disposition', `attachment;filename=fund_${moment().format('YYYYMMDD')}.csv`)
    ctx.set('Content-type', 'text/csv')
})

router.get('/similar-funds/:isins', async ctx => {
    const isins = ctx.params.isins.split(',')
    const similarFunds = await SimilarFundsDAO.getSimilarFunds(isins)

    const allSimilarIsins = _.uniq(similarFunds.flatMap(similarFundsEntry => similarFundsEntry.similarIsins))
    const allSimilarFunds = await SimilarFundsDAO.getSimilarFunds(allSimilarIsins)

    ctx.body = allSimilarFunds
})

router.post('/similar-funds', async ctx => {
    const { similarFunds } = ctx.request.body
    await SimilarFundsDAO.upsertSimilarFunds(similarFunds)
    ctx.status = 200
})

module.exports = router
