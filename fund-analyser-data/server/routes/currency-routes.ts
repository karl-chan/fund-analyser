import Router from 'koa-router'
import * as CurrencyDAO from '../../lib/db/CurrencyDAO'
import * as currencyUtils from '../../lib/util/currencyUtils'

const CURRENCY_URL_PREFIX = '/api/currency'

const router = new Router({
  prefix: CURRENCY_URL_PREFIX
})

router.get('/supported', async (ctx: any) => {
  ctx.body = await CurrencyDAO.listSupportedCurrencies()
})

router.get('/get', async (ctx: any) => {
  const { pairs } = ctx.request.query
  const currencies = pairs ? await CurrencyDAO.listCurrencies(pairs.trim().split(',')) : []
  ctx.body = currencies
})

router.get('/summary', async (ctx: any) => {
  const { invert } = ctx.request.query
  let currencies = await CurrencyDAO.listSummary()
  if (invert) {
    // make GBP quote currency
    currencies = currencies.map((c: any) => currencyUtils.invertCurrency(c))
  }
  currencies = currencyUtils.enrichSummary(currencies)
  const stats = currencyUtils.calcStats(currencies)
  ctx.body = {
    currencies,
    stats
  }
})

export default router
