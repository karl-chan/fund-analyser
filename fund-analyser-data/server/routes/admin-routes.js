const Router = require('koa-router')
const CharlesStanleyDirect = require('../../lib/fund/CharlesStanleyDirect')
const heroku = require('../../lib/util/heroku')

const csd = new CharlesStanleyDirect()

const URL_PREFIX = '/api/admin'
const router = new Router({
    prefix: URL_PREFIX
})

router.get('/logs/:dyno', async ctx => {
    const dyno = ctx.params.dyno
    const logStream = await heroku.streamLogs(dyno)
    ctx.body = logStream
})

router.get('/healthcheck', async ctx => {
    const isUp = await csd.healthCheck()
    ctx.body = { charlesStanleyDirect: isUp }
})

module.exports = router
