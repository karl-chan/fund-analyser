const properties = require('./properties')
const log = require('./log')

const defaultMaxAttempts = properties.get('http.max.attempts')
const defaultRetryInterval = properties.get('http.retry.interval')
const defaultMaxParallelConnections = properties.get('http.max.parallel.connections')

const async = require('async')
const request = require('request')
const _ = require('lodash')
const semaphore = require('semaphore')
const util = require('util')

const http = request.defaults({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
    }
})
http.maxAttempts = defaultMaxAttempts
http.retryInterval = defaultRetryInterval
http.counter = semaphore(defaultMaxParallelConnections)

http.setOptions = function (options) {
    if (options.maxAttempts) {
        this.maxAttempts = options.maxAttempts
    }
    if (options.retryInterval) {
        this.retryInterval = options.retryInterval
    }
    if (options.maxParallelConnections) {
        this.counter = semaphore(options.maxParallelConnections)
    }
}

http.gets = function (url, options, callback) {
    [options, callback] = processArgs(url, options, callback)
    async.retry({
        times: this.maxAttempts,
        interval: this.retryInterval
    }, (cb) => {
        this.counter.take(() => {
            this.get(options, (err, res, body) => {
                this.counter.leave()
                if (err) {
                    return cb(err)
                }
                try {
                    callback(err, res, body)
                } catch (err) {
                    log.error('Error caught in http callback for %s. Cause: %s', options.url || options, err.stack)
                    return cb(err)
                }
                cb()
            })
        })
    })
}

http.posts = function (url, options, callback) {
    [options, callback] = processArgs(url, options, callback)
    async.retry({
        times: this.maxAttempts,
        interval: this.retryInterval
    }, (cb) => {
        this.counter.take(() => {
            this.post(options, (err, res, body) => {
                this.counter.leave()
                if (err) {
                    return cb(err)
                }
                try {
                    callback(err, res, body)
                } catch (err) {
                    log.error('Error caught in http callback for %s, body: %s. Cause: %s',
                        options.url, util.inspect(options.form), err.stack)
                    return cb(err)
                }
                cb()
            })
        })
    })
}

http.asyncGet = async function (url, options) {
    return new Promise((resolve, reject) => {
        http.gets(url, options, (err, res, body) => {
            err ? reject(err) : resolve({res, body})
        })
    })
}

http.asyncPost = async function (url, options) {
    return new Promise((resolve, reject) => {
        http.posts(url, options, (err, res, body) => {
            err ? reject(err) : resolve({res, body})
        })
    })
}

const processArgs = function (first, second, third) {
    let options, callback
    if (_.isNil(third)) {
        [options, callback] = [first, second]
    } else {
        [options, callback] = [second, third]
        options = {...options, ...{url: first}}
    }
    return [options, callback]
}

module.exports = _.clone(http)
