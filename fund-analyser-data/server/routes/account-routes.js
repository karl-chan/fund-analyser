const Router = require('koa-router')
const auth = require('../auth')
const log = require('../../lib/util/log.js')
const CharlesStanleyDirectAccount = require('../../lib/account/CharlesStanleyDirectAccount')

const ACCOUNT_URL_PREFIX = '/api/account'
const router = new Router({
    prefix: ACCOUNT_URL_PREFIX
})
router.use(auth.authorise)

const csdAccount = new CharlesStanleyDirectAccount()

router.get('/get/balance', async ctx => {
    const {jar} = ctx.request.body
    const balance = await csdAccount.getBalance(jar)
    ctx.body = {balance}
    log.info('Returned balance')
})

module.exports = router
