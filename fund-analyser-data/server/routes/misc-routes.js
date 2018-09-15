const Router = require('koa-router')
const CharlesStanleyDirect = require('../../lib/fund/CharlesStanleyDirect')

const csd = new CharlesStanleyDirect()

const URL_PREFIX = '/api'
const router = new Router({
    prefix: URL_PREFIX
})

router.get('/healthcheck', async ctx => {
    const isUp = await csd.healthCheck()
    ctx.body = { charlesStanleyDirect: isUp }
})

module.exports = router
