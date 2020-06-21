const Router = require('koa-router')
const Promise = require('bluebird')
const auth = require('../auth')
const trade = require('../../lib/trade/trade')
const CharlesStanleyDirectAccount = require('../../lib/account/CharlesStanleyDirectAccount')
const SessionDAO = require('../../lib/db/SessionDAO')
const UserDAO = require('../../lib/db/UserDAO')

const ACCOUNT_URL_PREFIX = '/api/account'
const router = new Router({
    prefix: ACCOUNT_URL_PREFIX
})
router.use(auth.authorise)

router.get('/', async ctx => {
    const { jar, user, pass } = ctx
    const csdAccount = new CharlesStanleyDirectAccount(jar, pass)
    const [balance, orders, statement, fundWatchlist, currencies, simulateParams] = await Promise.all([
        csdAccount.getBalance(),
        csdAccount.getOrders(),
        csdAccount.getStatement(),
        UserDAO.getFundWatchlist(user),
        UserDAO.getCurrencies(user),
        UserDAO.getSimulateParams(user)
    ])
    ctx.body = { balance, orders, statement, fundWatchlist, currencies, simulateParams }
})

router.get('/balance', async ctx => {
    const { jar, pass } = ctx
    const csdAccount = new CharlesStanleyDirectAccount(jar, pass)
    const balance = await csdAccount.getBalance()
    ctx.body = { balance }
})

router.get('/orders', async ctx => {
    const { jar, pass } = ctx
    const csdAccount = new CharlesStanleyDirectAccount(jar, pass)
    const orders = await csdAccount.getOrders()
    ctx.body = { orders }
})

router.get('/statement', async ctx => {
    const { jar, pass } = ctx
    const csdAccount = new CharlesStanleyDirectAccount(jar, pass)
    const statement = await csdAccount.getStatement()
    ctx.body = { statement }
})

router.get('/fund-watchlist', async ctx => {
    const user = ctx.user
    const fundWatchlist = await UserDAO.getFundWatchlist(user)
    ctx.body = { fundWatchlist }
})

router.post('/fund-watchlist/add', async ctx => {
    const user = ctx.user
    const { isin } = ctx.request.body
    await UserDAO.addToFundWatchlist(user, isin)
    ctx.status = 200
})

router.post('/fund-watchlist/remove', async ctx => {
    const user = ctx.user
    const { isin } = ctx.request.body
    const fundWatchlist = await UserDAO.removeFromFundWatchlist(user, isin)
    ctx.body = { fundWatchlist }
})

router.delete('/fund-watchlist', async ctx => {
    const user = ctx.user
    await UserDAO.clearFundWatchlist(user)
    ctx.status = 200
})

router.post('/currency/add', async ctx => {
    const user = ctx.user
    const { currency } = ctx.request.body
    await UserDAO.addToCurrencies(user, currency)
    ctx.status = 200
})

router.post('/currency/remove', async ctx => {
    const user = ctx.user
    const { currency } = ctx.request.body
    const currencies = await UserDAO.removeFromCurrencies(user, currency)
    ctx.body = { currencies }
})

router.get('/simulate-params', async ctx => {
    const user = ctx.user
    const simulateParams = await UserDAO.getSimulateParams(user)
    ctx.body = { simulateParams }
})

router.post('/simulate-params/add', async ctx => {
    const user = ctx.user
    const { simulateParam } = ctx.request.body
    await UserDAO.addToSimulateParams(user, simulateParam)
    ctx.status = 200
})

router.post('/simulate-params/remove', async ctx => {
    const user = ctx.user
    const { simulateParam } = ctx.request.body
    const simulateParams = await UserDAO.removeFromSimulateParams(user, simulateParam)
    ctx.body = simulateParams
})

router.post('/simulate-params/update', async ctx => {
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
            UserDAO.deactivateAllSimulateParams(user, simulateParam)
        ])
    }
    ctx.status = 200
})

router.post('/trade', async ctx => {
    const { jar, pass } = ctx
    const { simulateParam } = ctx.request.body
    const csdAccount = new CharlesStanleyDirectAccount(jar, pass)
    const orderReferences = await trade.trade(simulateParam, { csdAccount })
    ctx.body = {
        orderReferences
    }
})

module.exports = router
