import Http, { HttpOptions } from '../lib/util/http'
import * as properties from '../lib/util/properties'
const COMPUTE_HOST = properties.get('client.compute')
const http = new Http({
  timeout: properties.get('client.compute.timeout'),
  maxAttempts: properties.get('client.compute.max.attempts'),
  retryInterval: properties.get('client.compute.retry.interval')
})

export async function get (endpoint: string, params?: object) {
  const options: HttpOptions = { responseType: 'json' }
  if (params) {
    options.params = params
  }
  if (endpoint.startsWith('/')) {
    endpoint = endpoint.substring(1)
  }
  const { data } = await http.asyncGet(`${COMPUTE_HOST}/${endpoint}`, options)
  return tryParseJSON(data)
}

export async function post (endpoint: string, payload?: object) {
  const options: HttpOptions = { responseType: 'json' }
  if (payload) {
    options.data = payload
  }
  if (endpoint.startsWith('/')) {
    endpoint = endpoint.substring(1)
  }
  const { data } = await http.asyncPost(`${COMPUTE_HOST}/${endpoint}`, options)
  return tryParseJSON(data)
}

function tryParseJSON (body: string) {
  try {
    return JSON.parse(body)
  } catch (ignored) {
    return body
  }
}
