module.exports = dynoHealthcheck

const _ = require('lodash')
const moment = require('moment')

const heroku = require('../../lib/util/heroku.js')
const http = require('../../lib/util/http')
const log = require('../../lib/util/log.js')

const idleThreshold = moment.duration(5, 'minutes')
const dyno = 'worker'

/**
 * Performs health check on running heroku dynos. If stuck, restart them.
 */
async function dynoHealthcheck () {
    const client = heroku.newClient()
    const logs = await getLogs(client)
    const lastActivity = getLatestTimestamp(logs)

    const cutoffTime = moment().subtract(idleThreshold)
    if (!lastActivity || lastActivity.isBefore(cutoffTime)) {
        log.info(`Restarting dyno since last activity was %s`, lastActivity)
        await restartDyno(client)
    }
}

async function getLogs (client) {
    const res = await client.post(`/apps/${heroku.appName}/log-sessions`, {
        body: {
            dyno,
            lines: 1500
        }
    })
    const url = res.logplex_url
    const {body} = await http.asyncGet(url)
    return body
}

function getLatestTimestamp (logs) {
    try {
        const lines = logs.split(/\n/)
        const lastLine = _.findLast(lines, line => {
            return !_.isEmpty(line) && moment(line.split(' ')[0]).isValid()
        })
        return moment(lastLine.split(' ')[0])
    } catch (err) {
        log.error('Failed to get latest timestamp from logs. Cause: %s', err.stack)
        return undefined
    }
}

async function restartDyno (client) {
    await client.delete(`/apps/${heroku.appName}/dynos/${dyno}`)
}
