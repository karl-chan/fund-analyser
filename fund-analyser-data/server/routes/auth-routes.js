const Router = require('koa-router')
const UserDAO = require('../../lib/db/UserDAO')
const simulate = require('../../lib/simulate/simulate')
const log = require('../../lib/util/log')
const properties = require('../../lib/util/properties')
const security = require('../../lib/util/security')
const auth = require('../auth')

const AUTH_URL_PREFIX = '/api/auth'
const router = new Router({
    prefix: AUTH_URL_PREFIX
})

const VAPID_PUBLIC_KEY = properties.get('vapid.key.public')

router.post('/login', async ctx => {
    const { user, pass, memorableWord, persist, pushSubscription } = ctx.request.body
    log.info('User %s attempting to login', user)
    try {
        const { name } = await auth.login(ctx, user, pass, memorableWord, persist, pushSubscription)
        ctx.body = { user: name }
        log.info('Login successful')
    } catch (err) {
        ctx.status = 401
        ctx.body = { error: err.message }
        log.info('Login failed')
    }
})

router.post('/logout', async ctx => {
    log.info('Logging out user')
    await auth.logout(ctx)
    ctx.status = 200
    log.info('Logout successful')
})

router.get('/', async ctx => {
    const { name, expiry, location } = auth.getUser(ctx)
    const isLoggedIn = await auth.isLoggedIn(ctx)
    ctx.body = { user: name, isLoggedIn, expiry, location }
})

router.get('/sessions', async ctx => {
    const { user } = auth.getUser(ctx)
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

router.get('/push', async ctx => {
    ctx.body = {
        publicKey: VAPID_PUBLIC_KEY
    }
})

router.post('/push', async ctx => {
    const { user } = auth.getUser(ctx)
    if (!user) {
        ctx.status = 401
        ctx.body = { error: 'You must be logged in to push notifications.' }
        return
    }
    const simulateParams = await UserDAO.getSimulateParams(user)
    await simulate.pushNotificationsForUser(simulateParams, user)
    ctx.status = 200
})

router.post('/push/subscribe', async ctx => {
    const { pushSubscription } = ctx.request.body
    if (!pushSubscription) {
        ctx.status = 400
        return
    }
    const { user } = auth.getUser(ctx)
    if (!user) {
        ctx.status = 401
        ctx.body = { error: 'You must be logged in to subscribe to push notifications.' }
        return
    }
    auth.saveSession(ctx, { pushSubscription })
    ctx.status = 200
})

module.exports = router
