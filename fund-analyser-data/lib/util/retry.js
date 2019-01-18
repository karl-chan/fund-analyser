module.exports = retry

const _ = require('lodash')
const Promise = require('bluebird')

const log = require('./log')

const MAX_ATTEMPTS = 1
const RETRY_INTERVAL = 0 // in milliseconds
const SLOW_TASK_WARNING_INTERVAL = 10000 // warn every 10 seconds for slow tasks

async function retry (asyncFn, options) {
    const maxAttempts = _.get(options, 'maxAttempts', MAX_ATTEMPTS)
    const retryInterval = _.get(options, 'retryInterval', RETRY_INTERVAL)
    const description = _.get(options, 'description', '')

    let attempt = 1
    let result
    const start = Date.now()

    const slowTaskWarningMessage = setInterval(() => {
        const split = Date.now()
        log.silly(`Task [${description}] still running after ${split - start}ms`)
    }, SLOW_TASK_WARNING_INTERVAL)

    while (true) {
        try {
            result = await asyncFn()
            break
        } catch (err) {
            attempt++
            if (attempt > maxAttempts) {
                log.error(`Task [${description}] ran out of ${maxAttempts} retries!\nError: ${err.stack}`)
                clearInterval(slowTaskWarningMessage)
                throw err
            }
            log.warn(`Retrying task [${description}] on failed attempt ${attempt - 1}. Waiting ${retryInterval}ms...\nError: ${err.stack}`)
            await Promise.delay(retryInterval)
        }
    }
    clearInterval(slowTaskWarningMessage)
    const end = Date.now()
    log.silly(`Task [${description}] succeeded on attempt ${attempt} in ${end - start} ms`)
    return result
}
