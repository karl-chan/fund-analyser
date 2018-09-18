module.exports = retry

const _ = require('lodash')
const Promise = require('bluebird')

const log = require('./log')

const MAX_ATTEMPTS = 1
const RETRY_INTERVAL = 0 // in milliseconds

async function retry (asyncFn, options) {
    const maxAttempts = _.get(options, 'maxAttempts', MAX_ATTEMPTS)
    const retryInterval = _.get(options, 'retryInterval', RETRY_INTERVAL)
    const description = _.get(options, 'description', '')

    let attempt = 1
    while (true) {
        try {
            const result = await asyncFn()
            return result
        } catch (err) {
            log.warn(`Retrying task [${description}] on failed attempt ${attempt}. Waiting ${retryInterval}ms...\nError: ${err.stack}`)
            attempt++
            if (attempt > maxAttempts) {
                log.error(`Task [${description}] ran out of ${maxAttempts} retries!\nError: ${err.stack}`)
                throw err
            }
            await Promise.delay(retryInterval)
        }
    }
}
