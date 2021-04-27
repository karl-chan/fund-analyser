import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from 'axios'
import axiosCookieJarSupport from 'axios-cookiejar-support'
import FormData from 'form-data'
import * as _ from 'lodash'
import Semaphore from 'semaphore-async-await'
import log from './log'
import * as properties from './properties'
import retry from './retry'

axiosCookieJarSupport(axios)

const defaultMaxAttempts = properties.get('http.max.attempts')
const defaultRetryInterval = properties.get('http.retry.interval')
const defaultMaxParallelConnections = properties.get('http.max.parallel.connections')
const defaultTimeout = properties.get('http.timeout')

export interface HttpOptions extends AxiosRequestConfig {
  timeout?: number
  maxAttempts?: number
  retryInterval?: number
  maxParallelConnections?: number
}
export default class Http {
  private counter: Semaphore
  private http: AxiosInstance
  private maxAttempts: number
  private maxParallelConnections: number
  private retryInterval: number
  constructor (options?: HttpOptions) {
    this.http = axios.create({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
        'Accept-Encoding': 'gzip'
      },
      ...options,
      timeout: _.get(options, 'timeout', defaultTimeout)
    })
    this.http.interceptors.request.use(config => {
      if (config.data instanceof FormData) {
        Object.assign(config.headers, config.data.getHeaders())
      }
      return config
    })
    this.maxAttempts = _.get(options, 'maxAttempts', defaultMaxAttempts)
    this.retryInterval = _.get(options, 'retryInterval', defaultRetryInterval)
    this.maxParallelConnections = _.get(options, 'maxParallelConnections', defaultMaxParallelConnections)
    this.counter = new Semaphore(this.maxParallelConnections)
  }

  async asyncGet (url: string, options?: AxiosRequestConfig) {
    return this.asyncRequest('GET', url, options)
  }

  async asyncPost (url: string, options?: AxiosRequestConfig) {
    return this.asyncRequest('POST', url, options)
  }

  async asyncRequest (method: Method, url: string, options?: AxiosRequestConfig) {
    const requestOptions = {
      url,
      ...options,
      method,
      resolveWithFullResponse: true
    }
    const description = `${method} request to ${url}` +
      (options && options.params
        ? `\nwith query string: ${JSON.stringify(options.params)}`
        : '') +
      (options && options.data
        ? `\nwith data: ${JSON.stringify(options.data)}`
        : '')
    const retryOptions = {
      maxAttempts: this.maxAttempts,
      retryInterval: this.retryInterval,
      description
    }

    log.silly(`Http counter acquired. Remaining: ${this.counter.getPermits()} of ${this.maxParallelConnections}`)
    await this.counter.acquire()
    let result: AxiosResponse<any>
    try {
      result = await retry(async () => this.checkError(await this.http.request(requestOptions), url), retryOptions)
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
    if (response.status >= 400) {
      throw new Error(`Url: ${url} returned status code: ${response.status}!`)
    }
    return response
  }

  async stream (url: string) {
    const response = await this.asyncGet(url, { responseType: 'stream' })
    return response.data
  }
}
