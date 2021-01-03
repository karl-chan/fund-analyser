import Router from 'koa-router'
import * as simulate from '../../lib/simulate/simulate'

const SIMULATE_URL_PREFIX = '/api/simulate'

const router = new Router({
  prefix: SIMULATE_URL_PREFIX
})

router.post('/', async (ctx: any) => {
  const { simulateParam } = ctx.request.body
  ctx.body = await simulate.simulate(simulateParam)
})

router.post('/predict', async (ctx: any) => {
  const { simulateParam, date } = ctx.request.body
  ctx.body = await simulate.predict(simulateParam, date)
})

router.get('/strategies', async (ctx: any) => {
  ctx.body = await simulate.getStrategies()
})

export default router
