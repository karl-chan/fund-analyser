module.exports = {
    get,
    post
}

const properties = require('../lib/util/properties')
const env = require('../lib/util/env')
const Http = require('../lib/util/http')

const COMPUTE_HOST = env.isProduction()
    ? properties.get('client.compute.prod')
    : properties.get('client.compute.dev')

const http = new Http()

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
