module.exports = dynoHealthcheck

const _ = require('lodash')
const moment = require('moment')

const heroku = require('../../lib/util/heroku.js')
const http = require('../../lib/util/http')

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
        console.log(`Restarting dyno since last activity was ${lastActivity}`)
        await restartDyno(client)
    }
}

async function getLogs (client) {
    const res = await client.post(`/apps/${heroku.appName}/log-sessions`, {
        body: {
            dyno
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
        return undefined
    }
}

async function restartDyno (client) {
    const res = await client.delete(`/apps/${heroku.appName}/dynos/${dyno}`)
    console.log(res)
}
