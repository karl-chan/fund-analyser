const Router = require('koa-router')
const CharlesStanleyDirect = require('../../lib/fund/CharlesStanleyDirect')
const heroku = require('../../lib/util/heroku')

const csd = new CharlesStanleyDirect()

const URL_PREFIX = '/api/admin'
const router = new Router({
    prefix: URL_PREFIX
})

router.get('/healthcheck', async ctx => {
    const isUp = await csd.healthCheck()
    ctx.body = { charlesStanleyDirect: isUp }
})

router.get('/logs/:category', async ctx => {
    const { category } = ctx.params
    const { lines } = ctx.query
    ctx.body = await heroku.getLogs(category, lines)
})

router.post('/restart/:category', async ctx => {
    const { category } = ctx.params
    ctx.body = await heroku.restart(category)
})

module.exports = router
