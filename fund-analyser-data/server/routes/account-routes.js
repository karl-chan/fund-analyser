const Router = require('koa-router')
const Promise = require('bluebird')
const auth = require('../auth')
const CharlesStanleyDirectAccount = require('../../lib/account/CharlesStanleyDirectAccount')
const UserDAO = require('../../lib/db/UserDAO')

const ACCOUNT_URL_PREFIX = '/api/account'
const router = new Router({
    prefix: ACCOUNT_URL_PREFIX
})
router.use(auth.authorise)

router.get('/', async ctx => {
    const { jar, user } = ctx
    const csdAccount = new CharlesStanleyDirectAccount(jar)
    const [balance, orders, statement, watchlist, currencies] = await Promise.all([csdAccount.getBalance(), csdAccount.getOrders(), csdAccount.getStatement(), UserDAO.getWatchlist(user), UserDAO.getCurrencies(user)])
    ctx.body = { balance, orders, statement, watchlist, currencies }
})

router.get('/balance', async ctx => {
    const { jar } = ctx
    const csdAccount = new CharlesStanleyDirectAccount(jar)
    const balance = await csdAccount.getBalance()
    ctx.body = { balance }
})

router.get('/orders', async ctx => {
    const { jar } = ctx
    const csdAccount = new CharlesStanleyDirectAccount(jar)
    const orders = await csdAccount.getOrders()
    ctx.body = { orders }
})

router.get('/statement', async ctx => {
    const { jar } = ctx
    const csdAccount = new CharlesStanleyDirectAccount(jar)
    const statement = await csdAccount.getStatement()
    ctx.body = { statement }
})

router.get('/watchlist', async ctx => {
    const user = ctx.user
    const watchlist = await UserDAO.getWatchlist(user)
    ctx.body = { watchlist }
})

router.post('/watchlist/add', async ctx => {
    const user = ctx.user
    const { isin } = ctx.request.body
    await UserDAO.addToWatchlist(user, isin)
    ctx.status = 200
})

router.post('/watchlist/remove', async ctx => {
    const user = ctx.user
    const { isin } = ctx.request.body
    const watchlist = await UserDAO.removeFromWatchlist(user, isin)
    ctx.body = { watchlist }
})

router.delete('/watchlist', async ctx => {
    const user = ctx.user
    await UserDAO.clearWatchlist(user)
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

module.exports = router
