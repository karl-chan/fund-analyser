const Koa = require('koa')
const logger = require('koa-logger')
var bodyParser = require('koa-bodyparser');

const properties = require('../lib/util/properties')
const db = require('../lib/util/db')
const fundsRoutes = require('./routes/funds')


const PORT = process.env.PORT || properties.get('server.default.port');

const app = new Koa();

app.use(logger())
app.use(bodyParser());
app.use(fundsRoutes.routes())

const main = async () => {
    try {
        await db.init()
        console.log(`Connected to MongoDB`)
    } catch (err) {
        console.error('Failed to connect to MongoDB')
    }    
    
    app.listen(PORT, async () => {
        console.log(`Server listening on port: ${PORT}`)
    })
}
main()