const properties = require('./properties')
const retry = require('./retry')
const log = require('./log')

const defaultMaxAttempts = properties.get('http.max.attempts')
const defaultRetryInterval = properties.get('http.retry.interval')
const defaultMaxParallelConnections = properties.get('http.max.parallel.connections')

const request = require('request')
const rp = require('request-promise')
const _ = require('lodash')
const { default: Semaphore } = require('semaphore-async-await')

class Http {
    constructor (options) {
        this.http = rp.defaults({
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
            },
            timeout: 30000, // 30 seconds
            simple: false
        })
        this.maxAttempts = _.get(options, 'maxAttempts', defaultMaxAttempts)
        this.retryInterval = _.get(options, 'retryInterval', defaultRetryInterval)
        this.maxParallelConnections = _.get(options, 'maxParallelConnections', defaultMaxParallelConnections)
        this.counter = new Semaphore(this.maxParallelConnections)
    }

    async asyncGet (url, options) {
        return this.asyncRequest('GET', url, options)
    }

    async asyncPost (url, options) {
        return this.asyncRequest('POST', url, options)
    }

    async asyncRequest (method, url, options) {
        const requestOptions = {
            url,
            ...options,
            method,
            resolveWithFullResponse: true
        }
        const retryOptions = {
            maxAttempts: this.maxAttempts,
            retryInterval: this.retryInterval,
            description: `${method} request to ${url}`
        }

        log.silly(`Http counter acquired. Remaining: ${this.counter.getPermits()} of ${this.maxParallelConnections}`)
        await this.counter.acquire()
        let result
        try {
            result = await retry(async () => this.checkError(await this.http(requestOptions), url), retryOptions)
        } catch (err) {
            this.counter.release()
            log.silly(`Http counter released Remaining: ${this.counter.getPermits()} of ${this.maxParallelConnections}`)
            log.error(`HTTP ${method} request to ${url} failed!`)
            throw err
        }
        this.counter.release()
        log.silly(`Http counter released. Remaining: ${this.counter.getPermits()} of ${this.maxParallelConnections}`)
        return result
    }

    checkError (response, url) {
        if (response.statusCode >= 400) {
            throw new Error(`Url: ${url} returned status code: ${response.statusCode}!`)
        }
        return response
    }

    stream (url) {
        return request(url)
    }
}
module.exports = Http
