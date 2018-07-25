const Router = require('koa-router')
const CharlesStanleyDirect = require('../../lib/fund/CharlesStanleyDirect')

const URL_PREFIX = '/api'
const router = new Router({
    prefix: URL_PREFIX
})

const csd = new CharlesStanleyDirect()

router.get('/healthcheck', async ctx => {
    const charlesStanleyDirect = await new Promise((resolve, reject) => {
        csd.healthCheck((err, isUp) => {
            err ? reject(err) : resolve(isUp)
        })
    })
    ctx.body = { charlesStanleyDirect }
})

module.exports = router
