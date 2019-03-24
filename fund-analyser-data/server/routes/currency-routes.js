const Router = require('koa-router')
const CurrencyDAO = require('../../lib/db/CurrencyDAO')
const currencyUtils = require('../../lib/util/currencyUtils')

const CURRENCY_URL_PREFIX = '/api/currency'
const router = new Router({
    prefix: CURRENCY_URL_PREFIX
})

router.get('/supported', async ctx => {
    ctx.body = await CurrencyDAO.listSupportedCurrencies()
})

router.get('/get', async ctx => {
    const { pairs } = ctx.request.query
    const currencies = pairs ? await CurrencyDAO.listCurrencies(pairs.trim().split(',')) : []
    ctx.body = currencies
})

router.get('/summary', async ctx => {
    let currencies = await CurrencyDAO.listSupportedReturns()
    currencies = currencyUtils.enrichSummary(currencies)
    const stats = currencyUtils.calcStats(currencies)
    ctx.body = {
        currencies,
        metadata: { stats }
    }
})

module.exports = router
