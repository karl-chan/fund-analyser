const Router = require('koa-router')
const auth = require('../auth')
const log = require('../../lib/util/log.js')
const CharlesStanleyDirectAccount = require('../../lib/account/CharlesStanleyDirectAccount')
const UserDAO = require('../../lib/db/UserDAO')

const ACCOUNT_URL_PREFIX = '/api/account'
const router = new Router({
    prefix: ACCOUNT_URL_PREFIX
})
router.use(auth.authorise)

const csdAccount = new CharlesStanleyDirectAccount()

router.get('/balance', async ctx => {
    const jar = ctx.jar
    const balance = await csdAccount.getBalance(jar)
    ctx.body = {balance}
    log.info('Returned balance')
})

router.get('/watchlist', async ctx => {
    const user = ctx.user
    const watchlist = await UserDAO.getWatchlist(user)
    ctx.body = {watchlist}
})

router.post('/watchlist/add', async ctx => {
    const user = ctx.user
    const {isin} = ctx.request.body
    await UserDAO.addToWatchlist(user, isin)
    ctx.status = 200
})

router.post('/watchlist/remove', async ctx => {
    const user = ctx.user
    const {isin} = ctx.request.body
    const watchlist = await UserDAO.removeFromWatchlist(user, isin)
    ctx.body = {watchlist}
})

router.delete('/watchlist', async ctx => {
    const user = ctx.user
    await UserDAO.clearWatchlist(user)
    ctx.status = 200
})

module.exports = router
