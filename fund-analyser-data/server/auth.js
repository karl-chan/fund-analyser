
const CharlesStanleyDirectAuth = require('../lib/auth/CharlesStanleyDirectAuth')
const SessionDAO = require('../lib/db/SessionDAO')
const geolocation = require('../lib/util/geolocation')
const log = require('../lib/util/log')
const security = require('../lib/util/security')

const moment = require('moment')

const SHORT_EXPIRY = moment.duration(15, 'minutes')
const LONG_EXPIRY = moment.duration(1, 'month')

const SESSION_CONFIG = {
    maxAge: LONG_EXPIRY.asMilliseconds(),
    store: {
        async get (key, maxAge, { rolling }) {
            const jar = jarCache[key]
            const data = await SessionDAO.findSession(key)
            return {...data, jar}
        },
        async set (key, sess, maxAge, { rolling, changed }) {
            const {jar, ...data} = sess
            await SessionDAO.upsertSession(data, key)
            jarCache[key] = jar
        },
        async destroy (key) {
            await destroySessionById(key)
        }
    }
}
const jarCache = {} // {[sessionId: string]: jar: object}

const csdAuth = new CharlesStanleyDirectAuth()

const createToken = function ({user, pass, memorableWord, name, persist, location}) {
    return {
        user: user,
        pass: pass,
        memorableWord: memorableWord,
        name: name,
        expiry: newExpiry(persist),
        location: location
    }
}
const encryptToken = function (token) {
    return {
        user: token.user,
        pass: security.encryptString(token.pass),
        memorableWord: security.encryptString(token.memorableWord),
        name: token.name,
        expiry: token.expiry.toDate(),
        location: token.location
    }
}

const deserialiseToken = function (token) {
    return {
        user: token.user,
        pass: security.decryptString(token.pass),
        memorableWord: security.decryptString(token.memorableWord),
        name: token.name,
        expiry: moment(token.expiry),
        location: token.location
    }
}

const newExpiry = function (persist) {
    const duration = persist ? LONG_EXPIRY : SHORT_EXPIRY
    return moment().add(duration)
}

const saveSession = function (ctx, {token, jar}) {
    if (token) {
        ctx.session.token = encryptToken(token)
    }
    if (jar) {
        ctx.session.jar = jar
    }
}

const getSession = function (ctx) {
    return {
        token: ctx.session.token ? deserialiseToken(ctx.session.token) : null,
        jar: ctx.session.jar
    }
}

const getSessionId = function (ctx) {
    const contextSessionSymbol = Object.getOwnPropertySymbols(ctx)[0]
    const contextSession = ctx[contextSessionSymbol]
    return contextSession.externalKey
}

const destroySession = async function (ctx) {
    const contextSessionSymbol = Object.getOwnPropertySymbols(ctx)[0]
    const contextSession = ctx[contextSessionSymbol]
    await contextSession.remove()

    await contextSession.initFromExternal()
}

const destroySessionById = async function (sessionId) {
    await SessionDAO.deleteSession(sessionId)
    delete jarCache[sessionId]
}

const getUser = function (ctx) {
    const {token} = getSession(ctx)
    if (token) {
        const {user, name, expiry, location} = token
        return {user, name, expiry, location}
    }
    return {user: null, name: null, expiry: null, location: {}}
}

const findSessionsForUser = async function (user) {
    return SessionDAO.findSessionsForUser(user)
}

const extractIpAddress = function (req) {
    let ip = req.headers['x-forwarded-for']
    log.debug('X-forwarded-for: %s', ip)
    if (ip) {
        var list = ip.split(',')
        return list[list.length - 1]
    } else {
        return req.connection.remoteAddress
    }
}

const login = async function (ctx, user, pass, memorableWord, persist) {
    await destroySession(ctx)
    const ip = extractIpAddress(ctx.req)
    log.debug('Extracted ip address: %s', ip)
    const [{jar, name}, location] = await Promise.all([
        csdAuth.login(user, pass, memorableWord),
        geolocation.getLocationByIp(ip)
    ])
    location.ip = ip

    const token = createToken({user, pass, memorableWord, name, persist, location})
    saveSession(ctx, {token, jar})
    return {token, jar, name}
}

const logout = async function (ctx) {
    await destroySession(ctx)
}

const isLoggedIn = async function (ctx) {
    const {token, jar} = getSession(ctx)
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
        const stillLoggedIn = await csdAuth.isLoggedIn(jar)
        if (stillLoggedIn) {
            return true
        }
    }
    return refreshToken(ctx, token)
}

const refreshToken = async function (ctx, token) {
    try {
        const {user, pass, memorableWord} = token
        const {jar} = await csdAuth.login(user, pass, memorableWord)
        saveSession(ctx, {jar})
        return true
    } catch (err) {
        // fail to relogin
        console.error('Failed to renew token', err)
        return false
    }
}

module.exports = {
    SESSION_CONFIG,
    authorise: async (ctx, next) => {
        const stillLoggedIn = await isLoggedIn(ctx)
        if (!stillLoggedIn) {
            ctx.status = 401
            ctx.body = {error: 'Not logged in'}
            return
        }
        const {jar} = getSession(ctx)
        ctx.request.body = {...ctx.request.body, jar}
        await next()
    },
    login,
    logout,
    isLoggedIn,
    getUser,
    getSessionId,
    findSessionsForUser,
    destroySessionById
}
