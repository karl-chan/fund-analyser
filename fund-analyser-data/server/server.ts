import cors from '@koa/cors'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import compress from 'koa-compress'
import helmet from 'koa-helmet'
import logger from 'koa-logger'
import session from 'koa-session'
import sslify, { xForwardedProtoResolver } from 'koa-sslify'
import serve from 'koa-static-cache'
import moment from 'moment'
import * as path from 'path'
import * as zlib from 'zlib'
import SessionDAO from '../lib/db/SessionDAO'
import * as db from '../lib/util/db'
import * as env from '../lib/util/env'
import log from '../lib/util/log'
import { getProjectRoot } from '../lib/util/paths'
import * as properties from '../lib/util/properties'
import Stopwatch from '../lib/util/stopwatch'
import { SESSION_CONFIG } from './auth'
import * as fundCache from './cache/fundCache'
import * as stockCache from './cache/stockCache'
import accountRoutes from './routes/account-routes'
import adminRoutes from './routes/admin-routes'
import authRoutes from './routes/auth-routes'
import currencyRoutes from './routes/currency-routes'
import fundsRoutes from './routes/funds-routes'
import simulateRoutes from './routes/simulate-routes'
import stocksRoutes from './routes/stocks-routes'

const historyApiFallback = require('koa-history-api-fallback')

const PORT = process.env.PORT || properties.get('server.default.port')

const app = new Koa()
app.keys = [properties.get('secret.key')]

if (env.isProduction()) {
  app.use(helmet({
    contentSecurityPolicy: false
  }))
  app.use(sslify({ resolver: xForwardedProtoResolver }))
}

app.use(historyApiFallback({
  // Don't rewrite API requests (passthrough)
  rewrites: [{
    from: /^\/api\/.*$/,
    to: ({
      parsedUrl
    }: any) => parsedUrl.format()
  }]
}))
app.use(compress({
  br: {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 1
    }
  }
}))
app.use(logger())
app.use(cors())
app.use(session(SESSION_CONFIG, app))
app.use(bodyParser({ jsonLimit: '10mb' }))
app.use(serve(path.resolve(getProjectRoot(), '../fund-analyser-app/dist/pwa'), {
  maxAge: 365 * 24 * 60 * 60,
  buffer: true,
  gzip: true,
  usePrecompiledGzip: true
}))

app.use(accountRoutes.routes())
app.use(adminRoutes.routes())
app.use(authRoutes.routes())
app.use(currencyRoutes.routes())
app.use(fundsRoutes.routes())
app.use(simulateRoutes.routes())
app.use(stocksRoutes.routes())

const cleanupEvery = (frequency: number) => {
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

    await Promise.all([
      fundCache
        .start()
        .then(() => log.info(`Started fund cache in [${timer.split()}].`)),
      stockCache
        .start()
        .then(() => log.info(`Started stock cache in [${timer.split()}].`))
    ])
  } catch (err) {
    log.error(err.stack)
    process.exit(1)
  }

  cleanupEvery(moment.duration(1, 'hour').asMilliseconds())

  app.listen(PORT, async () => {
    log.info(`Server listening on port [${PORT}], startup took [${timer.end()}]`)
  })
}
main()
