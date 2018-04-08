const moment = require('moment')
const CharlesStanleyDirectAuth = require('../lib/auth/CharlesStanleyDirectAuth')

const SHORT_EXPIRY = moment.duration(15, 'minutes')
const LONG_EXPIRY = moment.duration(1, 'month')

const SESSION_CONFIG = {
    maxAge: LONG_EXPIRY.asMilliseconds,
    store: {
        get (key, maxAge, { rolling }) {
            return sessionStorage[key]
        },
        set (key, sess, maxAge, { rolling, changed }) {
            sessionStorage[key] = sess
        },
        destroy (key) {
            delete sessionStorage[key]
        }
    }
}
const sessionStorage = {} // {[sessionId: string]: sessionContents: Object}

const csdAuth = new CharlesStanleyDirectAuth()

const createToken = function (user, pass, memorableWord) {
    return {user, pass, memorableWord}
}

const deserialiseToken = function (token) {
    return {user: token.user, pass: token.pass, memorableWord: token.memorableWord}
}

const newExpiry = function (persist) {
    const duration = persist ? LONG_EXPIRY : SHORT_EXPIRY
    return moment().add(duration)
}

const saveSession = function (ctx, {token, jar, persist}) {
    ctx.session.token = token
    ctx.session.jar = jar
    // Assign new expiry only if it's a new session
    if (!ctx.session.expiry) {
        ctx.session.expiry = newExpiry(persist)
    }
}

const getSession = function (ctx) {
    return {
        token: ctx.session.token,
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
        const {user} = deserialiseToken(token)
        return {user, expiry}
    }
    return {user: null, expiry: null}
}

const login = async function (ctx, user, pass, memorableWord, persist) {
    await destroySession(ctx)
    const {jar, name} = await csdAuth.login(user, pass, memorableWord)
    const token = createToken(user, pass, memorableWord)
    saveSession(ctx, {token, jar, persist})
    return {token, jar, name}
}

const logout = async function (ctx) {
    await destroySession(ctx)
}

const isLoggedIn = async function (ctx) {
    const {token, jar, expiry} = getSession(ctx)
    const expired = !expiry || moment().isAfter(expiry)
    if (!jar || expired) {
        return false
    }
    const stillLoggedIn = await csdAuth.isLoggedIn(jar)
    if (stillLoggedIn) {
        return true
    }
    return refreshToken(ctx, token)
}

const refreshToken = async function (ctx, token) {
    try {
        const {user, pass, memorableWord} = deserialiseToken(token)
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
