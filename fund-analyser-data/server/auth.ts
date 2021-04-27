import { Promise } from 'bluebird'
import { Context, Request } from 'koa'
import moment from 'moment'
import { CookieJar } from 'tough-cookie'
import { PushSubscription } from 'web-push'
import CharlesStanleyDirectAuth from '../lib/auth/CharlesStanleyDirectAuth'
import SessionDAO from '../lib/db/SessionDAO'
import UserDAO from '../lib/db/UserDAO'
import * as geolocation from '../lib/util/geolocation'
import log from '../lib/util/log'
import * as security from '../lib/util/security'

interface Location {
 city: string
 region: string
 country: string
 ip: string
}
export interface Token {
    user: string,
    pass: string,
    memorableWord: string,
    name: string,
    expiry: Date,
        location: Location,
    userAgent: string
  }

const SHORT_EXPIRY = moment.duration(15, 'minutes')
const LONG_EXPIRY = moment.duration(1, 'month')

export const SESSION_CONFIG = {
  maxAge: LONG_EXPIRY.asMilliseconds(),
  store: {
    async get (key: any) {
      const jar = jarCache[key]
      const data = await SessionDAO.findSession(key)
      return { ...data, jar }
    },
    async set (key: any, sess: any) {
      const { jar, ...data } = sess
      await SessionDAO.upsertSession(data, key)
      jarCache[key] = jar
    },
    async destroy (key: any) {
      await destroySessionById(key)
    }
  }
}

const jarCache: {[sessionId: string]: CookieJar } = {}

const csdAuth = new CharlesStanleyDirectAuth()

export async function authorise (ctx: Context, next: any) {
  const stillLoggedIn = await isLoggedIn(ctx)
  if (!stillLoggedIn) {
    ctx.status = 401
    ctx.body = { error: 'Not logged in' }
    return
  }

  // add information to ctx
  const { jar } = getSession(ctx)
  const { user, pass, name } = getUser(ctx)
  ctx.jar = jar
  ctx.user = user
  ctx.pass = pass
  ctx.name = name
  await next()
}

export function createToken ({
  user,
  pass,
  memorableWord,
  name,
  persist,
  location,
  userAgent
}: {
  user: string,
  pass: string,
  memorableWord: string,
  name: string,
  persist: boolean,
  location: Location,
  userAgent: string
}) :Token {
  return {
    user: user,
    pass: pass,
    memorableWord: memorableWord,
    name: name,
    expiry: newExpiry(persist),
    location: location,
    userAgent: userAgent
  }
}
export function encryptToken (token: Token): Token {
  return {
    user: token.user,
    pass: security.encryptString(token.pass),
    memorableWord: security.encryptString(token.memorableWord),
    name: token.name,
    expiry: token.expiry,
    location: token.location,
    userAgent: token.userAgent
  }
}

export function deserialiseToken (token: Token): Token {
  return {
    user: token.user,
    pass: security.decryptString(token.pass),
    memorableWord: security.decryptString(token.memorableWord),
    name: token.name,
    expiry: token.expiry,
    location: token.location,
    userAgent: token.userAgent
  }
}

export function newExpiry (persist: boolean): Date {
  const duration = persist ? LONG_EXPIRY : SHORT_EXPIRY
  return moment().add(duration).toDate()
}

export function saveSession (ctx: Context, {
  token,
  jar,
  pushSubscription
}: {
  token?: Token,
  jar?: CookieJar,
  pushSubscription?: any
}) {
  if (token) {
    ctx.session.token = encryptToken(token)
  }
  if (jar) {
    ctx.session.jar = jar
  }
  if (pushSubscription) {
    ctx.session.pushSubscription = pushSubscription
  }
}

const saveUser = async function (user: string) {
  return UserDAO.createUserIfNotExists(user)
}

export function getSession (ctx: Context) {
  return {
    token: ctx.session.token ? deserialiseToken(ctx.session.token) : null,
    jar: ctx.session.jar
  }
}

export function getSessionId (ctx: Context) {
  const contextSessionSymbol = Object.getOwnPropertySymbols(ctx)[0]
  // @ts-ignore
  const contextSession = ctx[contextSessionSymbol]
  return contextSession.externalKey
}

const destroySession = async function (ctx: Context) {
  const contextSessionSymbol = Object.getOwnPropertySymbols(ctx)[0]
  // @ts-ignore
  const contextSession = ctx[contextSessionSymbol]
  await contextSession.remove()

  await contextSession.initFromExternal()
}

export async function destroySessionById (sessionId: string) {
  await SessionDAO.deleteSession(sessionId)
  delete jarCache[sessionId]
}

export function getUser (ctx: Context) {
  const { token } = getSession(ctx)
  if (token) {
    const { user, pass, name, expiry, location } = token
    return { user, pass, name, expiry, location }
  }
  return {
    user: null as string,
    pass: null as string,
    name: null as string,
    expiry: null as Date,
    location: {}
  }
}

export async function findSessionsForUser (user: string) {
  return SessionDAO.findSessionsForUser(user)
}

export function extractIpAddress (req: Request) {
  let ips = req.headers['x-forwarded-for']
  if (typeof ips === 'string') {
    ips = ips.split(',')
  }
  log.debug('X-forwarded-for: %s', ips)
  if (ips) {
    return ips[ips.length - 1]
  } else {
    return req.socket.remoteAddress
  }
}

export async function login (ctx: Context, user: string, pass: string, memorableWord: string, persist: boolean, pushSubscription: PushSubscription) {
  await destroySession(ctx)
  const ip = extractIpAddress(ctx.request)
  log.debug('Extracted ip address: %s', ip)

  const [{ jar, name }, location] = await Promise.all([
    csdAuth.login(user, pass, memorableWord),
    geolocation.getLocationByIp(ip)
  ])
  const userAgent = ctx.request.header['user-agent']

  const token = createToken({ user, pass, memorableWord, name, persist, location: { ...location, ip }, userAgent })
  saveSession(ctx, { token, jar, pushSubscription })
  saveUser(user)
  return { token, jar, name }
}

export async function logout (ctx: Context) {
  await destroySession(ctx)
}

export async function isLoggedIn (ctx: Context) {
  const { token, jar } = getSession(ctx)
  if (!token && !jar) {
    return false
  }
  if (token) {
    const expired = !token.expiry || moment().isAfter(token.expiry)
    if (expired) {
      return false
    }
  }
  if (jar) {
    const stillLoggedIn = await csdAuth.isLoggedIn({ jar })
    if (stillLoggedIn) {
      return true
    }
  }
  return refreshToken(ctx, token)
}

const refreshToken = async function (ctx: Context, token: Token) {
  try {
    const { user, pass, memorableWord } = token
    const { jar } = await csdAuth.login(user, pass, memorableWord)
    saveSession(ctx, { jar })
    return true
  } catch (err) {
    // fail to relogin
    console.error('Failed to renew token', err)
    return false
  }
}
