import * as _ from 'lodash'
import request from 'request'
import rp from 'request-promise'
import Semaphore from 'semaphore-async-await'
import log from './log'
import * as properties from './properties'
import retry from './retry'

const defaultMaxAttempts = properties.get('http.max.attempts')
const defaultRetryInterval = properties.get('http.retry.interval')
const defaultMaxParallelConnections = properties.get('http.max.parallel.connections')
const defaultTimeout = properties.get('http.timeout')

export interface HttpOptions extends rp.RequestPromiseOptions {
  timeout?: number
  maxAttempts?: number
  retryInterval?: number
  maxParallelConnections?: number
}
export default class Http {
  private counter: Semaphore
  private http: request.RequestAPI<rp.RequestPromise<any>, rp.RequestPromiseOptions, request.RequiredUriUrl>
  private maxAttempts: number
  private maxParallelConnections: number
  private retryInterval: number
  constructor (options?: HttpOptions) {
    this.http = rp.defaults({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
      },
      timeout: _.get(options, 'timeout', defaultTimeout),
      simple: false
    })
    this.maxAttempts = _.get(options, 'maxAttempts', defaultMaxAttempts)
    this.retryInterval = _.get(options, 'retryInterval', defaultRetryInterval)
    this.maxParallelConnections = _.get(options, 'maxParallelConnections', defaultMaxParallelConnections)
    this.counter = new Semaphore(this.maxParallelConnections)
  }

  async asyncGet (url: string, options?: rp.RequestPromiseOptions) {
    return this.asyncRequest('GET', url, options)
  }

  async asyncPost (url: string, options?: rp.RequestPromiseOptions) {
    return this.asyncRequest('POST', url, options)
  }

  async asyncRequest (method: string, url: string, options?: rp.RequestPromiseOptions) {
    const requestOptions = {
      url,
      ...options,
      method,
      resolveWithFullResponse: true
    }
    const description = `${method} request to ${url}` +
      (options && options.qs
        ? `\nwith query string: ${JSON.stringify(options.qs)}`
        : '') +
      (options && options.form
        ? `\nwith form: ${JSON.stringify(options.form)}`
        : '')
    const retryOptions = {
      maxAttempts: this.maxAttempts,
      retryInterval: this.retryInterval,
      description
    }

    log.silly(`Http counter acquired. Remaining: ${this.counter.getPermits()} of ${this.maxParallelConnections}`)
    await this.counter.acquire()
    let result
    try {
      result = await retry(async () => this.checkError(await this.http(requestOptions), url), retryOptions)
    } catch (err) {
      this.counter.release()
      log.silly(`Http counter released Remaining: ${this.counter.getPermits()} of ${this.maxParallelConnections}`)
      log.error(`${description} failed!`)
      throw err
    }
    this.counter.release()
    log.silly(`Http counter released. Remaining: ${this.counter.getPermits()} of ${this.maxParallelConnections}`)
    return result
  }

  checkError (response: any, url: string) {
    if (response.statusCode >= 400) {
      throw new Error(`Url: ${url} returned status code: ${response.statusCode}!`)
    }
    return response
  }

  stream (url: string) {
    return request(url)
  }
}
