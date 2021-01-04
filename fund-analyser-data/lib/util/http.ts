import * as properties from './properties'
import retry from './retry'
import log from './log'

import request from 'request'
import rp from 'request-promise'
import * as _ from 'lodash'
import Semaphore from 'semaphore-async-await'

const defaultMaxAttempts = properties.get('http.max.attempts')
const defaultRetryInterval = properties.get('http.retry.interval')
const defaultMaxParallelConnections = properties.get('http.max.parallel.connections')
const defaultTimeout = properties.get('http.timeout')

export default class Http {
    counter: any;
    http: any;
    maxAttempts: any;
    maxParallelConnections: any;
    retryInterval: any;
    constructor (options?: any) {
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

    async asyncGet (url: any, options?: any) {
      return this.asyncRequest('GET', url, options)
    }

    async asyncPost (url: any, options?: any) {
      return this.asyncRequest('POST', url, options)
    }

    async asyncRequest (method: any, url: any, options?: any) {
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

    checkError (response: any, url: any) {
      if (response.statusCode >= 400) {
        throw new Error(`Url: ${url} returned status code: ${response.statusCode}!`)
      }
      return response
    }

    stream (url: any) {
      return request(url)
    }
}
