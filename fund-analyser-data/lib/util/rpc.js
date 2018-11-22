module.exports = {
    exec
}

const properties = require('./properties')
const http = require('./http')

const RPC_DEV_HOST = properties.get('rpc.ml.host.dev')
const RPC_PROD_HOST = properties.get('rpc.ml.host.prod')

async function exec (operation, payload, envOverride) {
    const host = selectHost(envOverride)
    const options = { json: true }
    if (payload) {
        options.body = payload
    }
    return http.asyncPost(`${host}/${operation}`, options)
}

function selectHost (envOverride) {
    let host = RPC_DEV_HOST
    if (process.env.NODE_ENV === 'production') {
        host = RPC_PROD_HOST
    }
    if (envOverride) {
        if (envOverride.toLowerCase().startsWith('dev')) {
            host = RPC_DEV_HOST
        }
        if (envOverride.toLowerCase().startsWith('prod')) {
            host = RPC_PROD_HOST
        }
    }
    return host
}
