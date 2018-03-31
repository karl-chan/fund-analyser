const Koa = require('koa')
const enforceHttps = require('koa-sslify');
const compress = require('koa-compress')
const logger = require('koa-logger')
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser')
const serve = require('koa-static')

const properties = require('../lib/util/properties')
const db = require('../lib/util/db')
const fundsRoutes = require('./routes/funds')


const PORT = process.env.PORT || properties.get('server.default.port');

const app = new Koa();

if (process.env.NODE_ENV === 'production') {
    app.use(enforceHttps({
        trustProtoHeader: true
    }))
}

app.use(compress())
app.use(logger())
app.use(cors())
app.use(bodyParser())
app.use(serve(__dirname + '/../../fund-analyser-app/dist/spa-mat'))
app.use(fundsRoutes.routes())

const main = async () => {
    try {
        await db.init()
        console.log(`Connected to MongoDB.`)
    } catch (err) {
        console.error('Failed to connect to MongoDB.\n', err)
    }    
    
    app.listen(PORT, async () => {
        console.log(`Server listening on port: ${PORT}`)
    })
}
main()