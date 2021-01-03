import * as properties from '../lib/util/properties'
import Http from '../lib/util/http'
const COMPUTE_HOST = properties.get('client.compute')
const http = new Http({
  maxAttempts: properties.get('client.compute.max.attempts'),
  retryInterval: properties.get('client.compute.retry.interval')
})

export async function get (endpoint: any, params?: any) {
  const options = { json: true }
  if (params) {
    (options as any).qs = params
  }
  if (endpoint.startsWith('/')) {
    endpoint = endpoint.substring(1)
  }
  const { body } = await http.asyncGet(`${COMPUTE_HOST}/${endpoint}`, options)
  return tryParseJSON(body)
}

export async function post (endpoint: any, payload?: any) {
  const options = { json: true }
  if (payload) {
    (options as any).body = payload
  }
  if (endpoint.startsWith('/')) {
    endpoint = endpoint.substring(1)
  }
  const { body } = await http.asyncPost(`${COMPUTE_HOST}/${endpoint}`, options)
  return tryParseJSON(body)
}

function tryParseJSON (body: any) {
  try {
    return JSON.parse(body)
  } catch (ignored) {
    return body
  }
}
