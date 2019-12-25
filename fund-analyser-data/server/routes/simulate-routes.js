const Router = require('koa-router')
const compute = require('../../client/compute')

const SIMULATE_URL_PREFIX = '/api/simulate'
const router = new Router({
    prefix: SIMULATE_URL_PREFIX
})

router.post('/', async ctx => {
    const { simulateParam } = ctx.request.body
    ctx.body = await compute.post('/simulate', simulateParam)
})

router.post('/predict', async ctx => {
    const { simulateParam, date } = ctx.request.body
    ctx.body = await compute.post('/simulate/predict', { simulateParam, date })
})

router.get('/strategies', async ctx => {
    ctx.body = await compute.get('/simulate/strategies')
})

module.exports = router
