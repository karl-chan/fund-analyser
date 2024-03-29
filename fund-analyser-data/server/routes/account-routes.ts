import { Promise } from 'bluebird'
import { Context } from 'koa'
import Router from 'koa-router'
import CharlesStanleyDirectAccount from '../../lib/account/CharlesStanleyDirectAccount'
import SessionDAO from '../../lib/db/SessionDAO'
import UserDAO from '../../lib/db/UserDAO'
import trade from '../../lib/trade/trade'
import * as auth from '../auth'

const ACCOUNT_URL_PREFIX = '/api/account'

const router = new Router({
  prefix: ACCOUNT_URL_PREFIX
})
router.use(auth.authorise)

router.get('/', async (ctx: Context) => {
  const { jar, user, pass } = ctx
  const csdAccount = new CharlesStanleyDirectAccount(jar, pass)
  const [balance, orders, statement, fundWatchlist, stockWatchlist, currencies, simulateParams] = await Promise.all([
    csdAccount.getBalance(),
    csdAccount.getOrders(),
    csdAccount.getStatement(),
    UserDAO.getFundWatchlist(user),
    UserDAO.getStockWatchlist(user),
    UserDAO.getCurrencies(user),
    UserDAO.getSimulateParams(user)
  ])
  ctx.body = { balance, orders, statement, fundWatchlist, stockWatchlist, currencies, simulateParams }
})

router.get('/balance', async (ctx: Context) => {
  const { jar, pass } = ctx
  const csdAccount = new CharlesStanleyDirectAccount(jar, pass)
  const balance = await csdAccount.getBalance()
  ctx.body = { balance }
})

router.get('/orders', async (ctx: Context) => {
  const { jar, pass } = ctx
  const csdAccount = new CharlesStanleyDirectAccount(jar, pass)
  const orders = await csdAccount.getOrders()
  ctx.body = { orders }
})

router.get('/statement', async (ctx: Context) => {
  const { jar, pass } = ctx
  const csdAccount = new CharlesStanleyDirectAccount(jar, pass)
  const statement = await csdAccount.getStatement()
  ctx.body = { statement }
})

router.get('/fund-watchlist', async (ctx: Context) => {
  const user = ctx.user
  const fundWatchlist = await UserDAO.getFundWatchlist(user)
  ctx.body = { fundWatchlist }
})

router.post('/fund-watchlist/add', async (ctx: Context) => {
  const user = ctx.user
  const { isin } = ctx.request.body
  await UserDAO.addToFundWatchlist(user, isin)
  ctx.status = 200
})

router.post('/fund-watchlist/remove', async (ctx: Context) => {
  const user = ctx.user
  const { isin } = ctx.request.body
  const fundWatchlist = await UserDAO.removeFromFundWatchlist(user, isin)
  ctx.body = { fundWatchlist }
})

router.delete('/fund-watchlist', async (ctx: Context) => {
  const user = ctx.user
  await UserDAO.clearFundWatchlist(user)
  ctx.status = 200
})

router.get('/stock-watchlist', async (ctx: Context) => {
  const user = ctx.user
  const stockWatchlist = await UserDAO.getStockWatchlist(user)
  ctx.body = { stockWatchlist }
})

router.post('/stock-watchlist/add', async (ctx: Context) => {
  const user = ctx.user
  const { isin } = ctx.request.body
  await UserDAO.addToStockWatchlist(user, isin)
  ctx.status = 200
})

router.post('/stock-watchlist/remove', async (ctx: Context) => {
  const user = ctx.user
  const { isin } = ctx.request.body
  const stockWatchlist = await UserDAO.removeFromStockWatchlist(user, isin)
  ctx.body = { stockWatchlist }
})

router.delete('/stock-watchlist', async (ctx: Context) => {
  const user = ctx.user
  await UserDAO.clearStockWatchlist(user)
  ctx.status = 200
})

router.post('/currency/add', async (ctx: Context) => {
  const user = ctx.user
  const { currency } = ctx.request.body
  await UserDAO.addToCurrencies(user, currency)
  ctx.status = 200
})

router.post('/currency/remove', async (ctx: Context) => {
  const user = ctx.user
  const { currency } = ctx.request.body
  const currencies = await UserDAO.removeFromCurrencies(user, currency)
  ctx.body = { currencies }
})

router.get('/simulate-params', async (ctx: Context) => {
  const user = ctx.user
  const simulateParams = await UserDAO.getSimulateParams(user)
  ctx.body = { simulateParams }
})

router.post('/simulate-params/add', async (ctx: Context) => {
  const user = ctx.user
  const { simulateParam } = ctx.request.body
  await UserDAO.addToSimulateParams(user, simulateParam)
  ctx.status = 200
})

router.post('/simulate-params/remove', async (ctx: Context) => {
  const user = ctx.user
  const { simulateParam } = ctx.request.body
  const simulateParams = await UserDAO.removeFromSimulateParams(user, simulateParam)
  ctx.body = simulateParams
})

router.post('/simulate-params/update', async (ctx: Context) => {
  const user = ctx.user
  const { simulateParam, active } = ctx.request.body
  if (active) {
    await Promise.all([
      SessionDAO.upsertBackgroundSession(ctx.session.token),
      UserDAO.activateSimulateParam(user, simulateParam)
    ])
  } else {
    await Promise.all([
      SessionDAO.deleteBackgroundSession(user),
      UserDAO.deactivateAllSimulateParams(user)
    ])
  }
  ctx.status = 200
})

router.post('/trade', async (ctx: Context) => {
  const { jar, pass } = ctx
  const { simulateParam } = ctx.request.body
  const csdAccount = new CharlesStanleyDirectAccount(jar, pass)
  const orderReferences = await trade(simulateParam, { csdAccount })
  ctx.body = {
    orderReferences
  }
})

export default router
