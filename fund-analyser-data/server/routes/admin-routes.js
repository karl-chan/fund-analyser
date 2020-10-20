const Router = require('koa-router')
const Promise = require('bluebird')
const TestReportDAO = require('../../lib/db/TestReportDAO')
const CharlesStanleyDirect = require('../../lib/fund/CharlesStanleyDirect')
const heroku = require('../../lib/util/heroku')

const csd = new CharlesStanleyDirect()

const URL_PREFIX = '/api/admin'
const router = new Router({
    prefix: URL_PREFIX
})

router.get('/healthcheck', async ctx => {
    const [isUp, isPassing] = await Promise.all([
        csd.healthCheck(),
        TestReportDAO.isPassing()
    ])
    ctx.body = {
        charlesStanleyDirect: isUp,
        testsPassing: isPassing
    }
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

router.get('/test-report', async ctx => {
    ctx.body = await TestReportDAO.getTestReport()
})

module.exports = router
