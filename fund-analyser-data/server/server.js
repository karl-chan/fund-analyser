const Koa = require('koa')
const path = require('path')
const helmet = require('koa-helmet')
const compress = require('koa-compress')
const logger = require('koa-logger')
const cors = require('@koa/cors')
const session = require('koa-session')
const bodyParser = require('koa-bodyparser')
const serve = require('koa-static-cache')
const { default: sslify, xForwardedProtoResolver } = require('koa-sslify')
const moment = require('moment')

const properties = require('../lib/util/properties')
const db = require('../lib/util/db')
const log = require('../lib/util/log')
const SessionDAO = require('../lib/db/SessionDAO')
const Stopwatch = require('../lib/util/stopwatch')

const auth = require('./auth')
const accountRoutes = require('./routes/account-routes')
const authRoutes = require('./routes/auth-routes')
const currencyRoutes = require('./routes/currency-routes')
const fundsRoutes = require('./routes/funds-routes')
const adminRoutes = require('./routes/admin-routes')
const fundCache = require('./cache/fundCache')

const PORT = process.env.PORT || properties.get('server.default.port')

const app = new Koa()
app.keys = [properties.get('secret.key')]

// redirect / to index.html
app.use(async (ctx, next) => {
    if (ctx.request.url === '/') {
        ctx.redirect('/index.html')
        return
    }
    await next()
})

if (process.env.NODE_ENV === 'production') {
    app.use(helmet())
    app.use(sslify({ resolver: xForwardedProtoResolver }))
}

app.use(compress())
app.use(logger())
app.use(cors())
app.use(session(auth.SESSION_CONFIG, app))
app.use(bodyParser())
app.use(serve(path.resolve(__dirname, '../../fund-analyser-app/dist/spa-mat'), {
    maxAge: 365 * 24 * 60 * 60,
    buffer: true,
    gzip: true,
    usePrecompiledGzip: true
}))

app.use(accountRoutes.routes())
app.use(authRoutes.routes())
app.use(currencyRoutes.routes())
app.use(fundsRoutes.routes())
app.use(adminRoutes.routes())

const cleanupEvery = (frequency) => {
    const cleanup = () => {
        SessionDAO.deleteExpiredSessions()
    }
    cleanup()
    setInterval(cleanup, frequency)
}

const main = async () => {
    const timer = new Stopwatch()
    try {
        await db.init()
        log.info(`Connected to MongoDB in [${timer.split()}].`)
        await fundCache.start()
        log.info(`Started fund cache in [${timer.split()}].`)
    } catch (err) {
        log.error(err)
        process.exit(1)
    }

    cleanupEvery(moment.duration(1, 'hour').asMilliseconds())

    app.listen(PORT, async () => {
        log.info(`Server listening on port [${PORT}], startup took [${timer.end()}]`)
    })
}
main()
