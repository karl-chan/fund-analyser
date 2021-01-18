import { Context } from 'koa'
import Router from 'koa-router'
import * as simulate from '../../lib/simulate/simulate'

const SIMULATE_URL_PREFIX = '/api/simulate'

const router = new Router({
  prefix: SIMULATE_URL_PREFIX
})

router.post('/', async (ctx: Context) => {
  const { simulateParam } = ctx.request.body
  ctx.body = await simulate.simulate(simulateParam)
})

router.post('/predict', async (ctx: Context) => {
  const { simulateParam, date } = ctx.request.body
  ctx.body = await simulate.predict(simulateParam, date)
})

router.get('/strategies', async (ctx: Context) => {
  ctx.body = await simulate.getStrategies()
})

export default router
