import rp from 'request-promise'
import Http, { HttpOptions } from '../lib/util/http'
import * as properties from '../lib/util/properties'
const COMPUTE_HOST = properties.get('client.compute')
const http = new Http({
  maxAttempts: properties.get('client.compute.max.attempts'),
  retryInterval: properties.get('client.compute.retry.interval')
})

export async function get (endpoint: string, params?: object) {
  const options: HttpOptions = { json: true }
  if (params) {
    options.qs = params
  }
  if (endpoint.startsWith('/')) {
    endpoint = endpoint.substring(1)
  }
  const { body } = await http.asyncGet(`${COMPUTE_HOST}/${endpoint}`, options)
  return tryParseJSON(body)
}

export async function post (endpoint: string, payload?: object) {
  const options: rp.RequestPromiseOptions = { json: true }
  if (payload) {
    options.body = payload
  }
  if (endpoint.startsWith('/')) {
    endpoint = endpoint.substring(1)
  }
  const { body } = await http.asyncPost(`${COMPUTE_HOST}/${endpoint}`, options)
  return tryParseJSON(body)
}

function tryParseJSON (body: string) {
  try {
    return JSON.parse(body)
  } catch (ignored) {
    return body
  }
}
