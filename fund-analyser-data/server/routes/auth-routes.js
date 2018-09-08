const Router = require('koa-router')
const log = require('../../lib/util/log')
const security = require('../../lib/util/security')
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

router.get('/', async ctx => {
    const {name, expiry, location} = auth.getUser(ctx)
    const isLoggedIn = await auth.isLoggedIn(ctx)
    ctx.body = {user: name, isLoggedIn, expiry, location}
})

router.get('/sessions', async ctx => {
    const {user} = auth.getUser(ctx)
    const sessionId = auth.getSessionId(ctx)
    const sessions = await auth.findSessionsForUser(user)
    ctx.body = sessions.map(s => ({
        encryptedId: security.encryptString(s.sessionId),
        location: s.token.location,
        expiry: s.token.expiry,
        userAgent: security.parseUserAgent(s.token.userAgent),
        current: s.sessionId === sessionId
    }))
})

router.delete('/session', async ctx => {
    if (!ctx.query.encryptedId) {
        ctx.status = 400
        return
    }
    const sessionId = security.decryptString(ctx.query.encryptedId)
    auth.destroySessionById(sessionId)
    ctx.status = 200
})

module.exports = router
