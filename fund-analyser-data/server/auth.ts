import { Promise } from 'bluebird'
import CharlesStanleyDirectAuth from '../lib/auth/CharlesStanleyDirectAuth'
import SessionDAO from '../lib/db/SessionDAO'
import UserDAO from '../lib/db/UserDAO'
import * as geolocation from '../lib/util/geolocation'
import log from '../lib/util/log'
import * as security from '../lib/util/security'

import moment from 'moment'

interface Location {
 city: string
 region: string
 country: string
 ip: string
}
interface Token {
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
    async get (key: any, maxAge: any, {
      rolling
    }: any) {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      const jar = jarCache[key]
      const data = await SessionDAO.findSession(key)
      return { ...data, jar }
    },
    async set (key: any, sess: any, maxAge: any, {
      rolling,
      changed
    }: any) {
      const { jar, ...data } = sess
      await SessionDAO.upsertSession(data, key)
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      jarCache[key] = jar
    },
    async destroy (key: any) {
      await destroySessionById(key)
    }
  }
}

const jarCache = {} // {[sessionId: string]: jar: object}

const csdAuth = new CharlesStanleyDirectAuth()

export async function authorise (ctx: any, next: any) {
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
export function encryptToken (token: any) {
  return {
    user: token.user,
    pass: security.encryptString(token.pass),
    memorableWord: security.encryptString(token.memorableWord),
    name: token.name,
    expiry: token.expiry.toDate(),
    location: token.location,
    userAgent: token.userAgent
  }
}

export function deserialiseToken (token: any) {
  return {
    user: token.user,
    pass: security.decryptString(token.pass),
    memorableWord: security.decryptString(token.memorableWord),
    name: token.name,
    expiry: moment(token.expiry),
    location: token.location,
    userAgent: token.userAgent
  }
}

export function newExpiry (persist: any) {
  const duration = persist ? LONG_EXPIRY : SHORT_EXPIRY
  return moment().add(duration).toDate()
}

export function saveSession (ctx: any, {
  token,
  jar,
  pushSubscription
}: any) {
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

const saveUser = async function (user: any) {
  return UserDAO.createUserIfNotExists(user)
}

export function getSession (ctx: any) {
  return {
    token: ctx.session.token ? deserialiseToken(ctx.session.token) : null,
    jar: ctx.session.jar
  }
}

export function getSessionId (ctx: any) {
  const contextSessionSymbol = Object.getOwnPropertySymbols(ctx)[0]
  const contextSession = ctx[contextSessionSymbol]
  return contextSession.externalKey
}

const destroySession = async function (ctx: any) {
  const contextSessionSymbol = Object.getOwnPropertySymbols(ctx)[0]
  const contextSession = ctx[contextSessionSymbol]
  await contextSession.remove()

  await contextSession.initFromExternal()
}

export async function destroySessionById (sessionId: any) {
  await SessionDAO.deleteSession(sessionId)
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  delete jarCache[sessionId]
}

export function getUser (ctx: any) {
  const { token } = getSession(ctx)
  if (token) {
    const { user, pass, name, expiry, location } = token
    return { user, pass, name, expiry, location }
  }
  return { user: null, pass: null, name: null, expiry: null, location: {} }
}

export async function findSessionsForUser (user: any) {
  return SessionDAO.findSessionsForUser(user)
}

export function extractIpAddress (req: any) {
  const ip = req.headers['x-forwarded-for']
  log.debug('X-forwarded-for: %s', ip)
  if (ip) {
    const list = ip.split(',')
    return list[list.length - 1]
  } else {
    return req.connection.remoteAddress
  }
}

export async function login (ctx: any, user: any, pass: any, memorableWord: any, persist: any, pushSubscription: any) {
  await destroySession(ctx)
  const ip = extractIpAddress(ctx.req)
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

export async function logout (ctx: any) {
  await destroySession(ctx)
}

export async function isLoggedIn (ctx: any) {
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

const refreshToken = async function (ctx: any, token: any) {
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
