const Router = require('koa-router')
const log = require('../../lib/util/log.js')
const auth = require('../auth')

const AUTH_URL_PREFIX = '/api/auth'
const router = new Router({
    prefix: AUTH_URL_PREFIX
})

router.post('/login', async ctx => {
    const {user, pass, memorableWord, persist} = ctx.request.body
    log.info('User %s attempting to login', user)
    try {
        const { name } = await auth.login(ctx, user, pass, memorableWord, persist)
        ctx.body = { user: name }
        log.info('Login successful')
    } catch (err) {
        ctx.status = 401
        ctx.body = { error: err.message }
        log.info('Login failed', err)
    }
})

router.post('/logout', async ctx => {
    log.info('Logging out user')
    await auth.logout(ctx)
    ctx.status = 200
    log.info('Logout successful')
})

router.get('/get', async ctx => {
    const {user, expiry} = auth.getUser(ctx)
    const isLoggedIn = await auth.isLoggedIn(ctx)
    ctx.body = {user, isLoggedIn, expiry}
})

module.exports = router
