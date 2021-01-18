import { Context } from 'koa'
import Router from 'koa-router'
import * as simulate from '../../lib/simulate/simulate'
import log from '../../lib/util/log'
import * as properties from '../../lib/util/properties'
import * as security from '../../lib/util/security'
import * as auth from '../auth'

const AUTH_URL_PREFIX = '/api/auth'

const router = new Router({
  prefix: AUTH_URL_PREFIX
})

const VAPID_PUBLIC_KEY = properties.get('vapid.key.public')

router.post('/login', async (ctx: Context) => {
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

router.post('/logout', async (ctx: Context) => {
  log.info('Logging out user')
  await auth.logout(ctx)
  ctx.status = 200
  log.info('Logout successful')
})

router.get('/', async (ctx: Context) => {
  const { name, expiry, location } = auth.getUser(ctx)
  const isLoggedIn = await auth.isLoggedIn(ctx)
  ctx.body = { user: name, isLoggedIn, expiry, location }
})

router.get('/sessions', async (ctx: Context) => {
  const { user } = auth.getUser(ctx)
  const sessionId = auth.getSessionId(ctx)
  const sessions = await auth.findSessionsForUser(user)
  ctx.body = sessions.map((s: any) => ({
    encryptedId: security.encryptString(s.sessionId),
    location: s.token.location,
    expiry: s.token.expiry,
    userAgent: security.parseUserAgent(s.token.userAgent),
    current: s.sessionId === sessionId
  }))
})

router.delete('/session', async (ctx: Context) => {
  if (!ctx.query.encryptedId) {
    ctx.status = 400
    return
  }
  const sessionId = security.decryptString(ctx.query.encryptedId)
  auth.destroySessionById(sessionId)
  ctx.status = 200
})

router.get('/push', async (ctx: Context) => {
  ctx.body = {
    publicKey: VAPID_PUBLIC_KEY
  }
})

router.post('/push', async (ctx: Context) => {
  const { user } = auth.getUser(ctx)
  if (!user) {
    ctx.status = 401
    ctx.body = { error: 'You must be logged in to push notifications.' }
    return
  }
  await simulate.pushNotificationsForUser(user)
  ctx.status = 200
})

router.post('/push/subscribe', async (ctx: Context) => {
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

export default router
