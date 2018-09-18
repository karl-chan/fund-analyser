module.exports = dynoHealthcheck

const moment = require('moment')

const heroku = require('../../lib/util/heroku')
const log = require('../../lib/util/log')

const idleThreshold = moment.duration(5, 'minutes')

/**
 * Performs health check on running heroku dynos. If stuck, restart them.
 */
async function dynoHealthcheck () {
    const lastActivity = await heroku.getLastActivity()

    const cutoffTime = moment().subtract(idleThreshold)
    if (!lastActivity || lastActivity.isBefore(cutoffTime)) {
        log.info(`Restarting dyno since last activity was %s`, lastActivity)
        await heroku.restart()
    }
}
