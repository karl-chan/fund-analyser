const Koa = require('koa')
const logger = require('koa-logger')

const properties = require('../lib/util/properties')
const db = require('../lib/util/db')
const fundRoutes = require('./routes/fund')


const PORT = process.env.PORT || properties.get('server.default.port');

const app = new Koa()

app.use(logger())

app.use(fundRoutes.routes())


app.listen(PORT, async () => {
    try {
    await db.init()
    } catch(err) {
        console.error('Failed to connect to MongoDB')
    }
    console.log(`Connected to MongoDB`)
    console.log(`Server listening on port: ${PORT}`)
})