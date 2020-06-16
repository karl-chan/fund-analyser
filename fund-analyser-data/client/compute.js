module.exports = {
    get,
    post
}

const properties = require('../lib/util/properties')
const Http = require('../lib/util/http')

const COMPUTE_HOST = properties.get('client.compute')

const http = new Http({
    maxAttempts: properties.get('client.compute.max.attempts'),
    retryInterval: properties.get('client.compute.retry.interval')
})

async function get (endpoint, params) {
    const options = { json: true }
    if (params) {
        options.qs = params
    }
    if (endpoint.startsWith('/')) {
        endpoint = endpoint.substring(1)
    }
    const { body } = await http.asyncGet(`${COMPUTE_HOST}/${endpoint}`, options)
    return tryParseJSON(body)
}

async function post (endpoint, payload) {
    const options = { json: true }
    if (payload) {
        options.body = payload
    }
    if (endpoint.startsWith('/')) {
        endpoint = endpoint.substring(1)
    }
    const { body } = await http.asyncPost(`${COMPUTE_HOST}/${endpoint}`, options)
    return tryParseJSON(body)
}

function tryParseJSON (body) {
    try {
        return JSON.parse(body)
    } catch (ignored) {
        return body
    }
}
