module.exports = {
    exec
}

const properties = require('../lib/util/properties')
const Http = require('../lib/util/http')

const DEV_HOST = properties.get('client.compute.host.dev')
const PROD_HOST = properties.get('client.compute.host.prod')

const http = new Http()

async function exec (operation, payload, envOverride) {
    const host = selectHost(envOverride)
    const options = { json: true }
    if (payload) {
        options.body = payload
    }
    const { body } = await http.asyncPost(`${host}/api/${operation}`, options)
    try {
        return JSON.parse(body)
    } catch (ignored) {
        return body
    }
}

function selectHost (env = process.env.NODE_ENV) {
    return env === 'production' ? PROD_HOST : DEV_HOST
}
