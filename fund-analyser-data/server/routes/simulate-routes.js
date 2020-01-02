const Router = require('koa-router')
const simulate = require('../../lib/simulate/simulate')

const SIMULATE_URL_PREFIX = '/api/simulate'
const router = new Router({
    prefix: SIMULATE_URL_PREFIX
})

router.post('/', async ctx => {
    const { simulateParam } = ctx.request.body
    ctx.body = await simulate.simulate(simulateParam)
})

router.post('/predict', async ctx => {
    const { simulateParam, date } = ctx.request.body
    ctx.body = await simulate.predict(simulateParam, date)
})

router.get('/strategies', async ctx => {
    ctx.body = await simulate.getStrategies()
})

module.exports = router
