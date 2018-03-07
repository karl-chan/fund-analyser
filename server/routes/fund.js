const Router = require('koa-router')
const db = require('../../lib/util/db')

const router = new Router()
const BASE_URL = '/api/fund'

router.get(`${BASE_URL}/get-all`, async ctx => {
    const query = {}
    const options = {
        projection: {historicPrices: 0, percentiles: 0}
    }
    const funds = await db.getFunds().find(query, options).toArray()
    ctx.body = funds
})


module.exports = router