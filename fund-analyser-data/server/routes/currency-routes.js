const Router = require('koa-router')
const CurrencyDAO = require('../../lib/db/CurrencyDAO')

const CURRENCY_URL_PREFIX = '/api/currency'
const router = new Router({
    prefix: CURRENCY_URL_PREFIX
})

router.get('/list/supported', async ctx => {
    ctx.body = await CurrencyDAO.listSupportedCurrencies()
})

router.get('/list', async ctx => {
    const { pairs } = ctx.request.query
    const currenciesMap = await CurrencyDAO.listCurrencies(pairs.trim().split(','))
    ctx.body = currenciesMap
})

module.exports = router
