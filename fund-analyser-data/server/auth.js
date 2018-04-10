const moment = require('moment')
const security = require('../lib/util/security')
const CharlesStanleyDirectAuth = require('../lib/auth/CharlesStanleyDirectAuth')
const SessionDAO = require('../lib/db/SessionDAO')

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
            await SessionDAO.deleteSession(key)
            delete jarCache[key]
        }
    }
}
const jarCache = {} // {[sessionId: string]: jar: object}

const csdAuth = new CharlesStanleyDirectAuth()

const createToken = function (user, pass, memorableWord, name, persist) {
    return {
        user: user,
        pass: pass,
        memorableWord: memorableWord,
        name: name,
        expiry: newExpiry(persist)
    }
}
const encryptToken = function (token) {
    return {
        user: security.encryptString(token.user),
        pass: security.encryptString(token.pass),
        memorableWord: security.encryptString(token.memorableWord),
        name: security.encryptString(token.name),
        expiry: token.expiry.unix()
    }
}

const deserialiseToken = function (token) {
    return {
        user: security.decryptString(token.user),
        pass: security.decryptString(token.pass),
        memorableWord: security.decryptString(token.memorableWord),
        name: security.decryptString(token.name),
        expiry: moment.unix(token.expiry)
    }
}

const newExpiry = function (persist) {
    const duration = persist ? LONG_EXPIRY : SHORT_EXPIRY
    return moment().add(duration)
}

const saveSession = function (ctx, {token, jar}) {
    ctx.session.token = token ? encryptToken(token) : null
    ctx.session.jar = jar
}

const getSession = function (ctx) {
    return {
        token: ctx.session.token ? deserialiseToken(ctx.session.token) : null,
        jar: ctx.session.jar,
        expiry: ctx.session.expiry
    }
}

const destroySession = async function (ctx) {
    const contextSessionSymbol = Object.getOwnPropertySymbols(ctx)[0]
    const contextSession = ctx[contextSessionSymbol]
    await contextSession.remove()

    await contextSession.initFromExternal()
}

const getUser = function (ctx) {
    const {token, expiry} = getSession(ctx)
    if (token) {
        const {name} = token
        return {user: name, expiry}
    }
    return {user: null, expiry: null}
}

const login = async function (ctx, user, pass, memorableWord, persist) {
    await destroySession(ctx)
    const {jar, name} = await csdAuth.login(user, pass, memorableWord)
    const token = createToken(user, pass, memorableWord, name, persist)
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
        const {jar} = await login(user, pass, memorableWord)
        saveSession(ctx, {token, jar})
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
    getUser
}
