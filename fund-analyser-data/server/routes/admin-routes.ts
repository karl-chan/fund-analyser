import { Promise } from 'bluebird'
import Router from 'koa-router'
import * as TestReportDAO from '../../lib/db/TestReportDAO'
import CharlesStanleyDirect from '../../lib/fund/CharlesStanleyDirect'
import * as heroku from '../../lib/util/heroku'

const csd = new CharlesStanleyDirect()

const URL_PREFIX = '/api/admin'
const router = new Router({
  prefix: URL_PREFIX
})

router.get('/healthcheck', async (ctx: any) => {
  const [isUp, isPassing] = await Promise.all([
    csd.healthCheck(),
    TestReportDAO.isPassing()
  ])
  ctx.body = {
    charlesStanleyDirect: isUp,
    testsPassing: isPassing
  }
})

router.get('/logs/:category', async (ctx: any) => {
  const { category } = ctx.params
  const { lines } = ctx.query
  ctx.body = await heroku.getLogs(category, lines)
})

router.post('/restart/:category', async (ctx: any) => {
  const { category } = ctx.params
  ctx.body = await heroku.restart(category)
})

router.get('/test-report', async (ctx: any) => {
  ctx.body = await TestReportDAO.getTestReport()
})

export default router
