
const properties = require('./properties')
const Http = require('./http')
const log = require('./log')
const Heroku = require('heroku-client')
const _ = require('lodash')
const moment = require('moment')

const appName = properties.get('heroku.app.name')
const token = properties.get('heroku.api.token')
const client = new Heroku({token})
const http = new Http()

const WORKER_DYNO = 'worker'

async function getLogs (dyno = WORKER_DYNO) {
    const res = await client.post(`/apps/${appName}/log-sessions`, {
        body: {
            dyno,
            lines: 1500
        }
    })
    const url = res.logplex_url
    const {body} = await http.asyncGet(url)
    return body
}

async function getLastActivity (dyno = WORKER_DYNO) {
    const logs = await getLogs(dyno)
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

async function restart (dyno = WORKER_DYNO) {
    await client.delete(`/apps/${appName}/dynos/${dyno}`)
}

module.exports = {
    getLogs,
    getLastActivity,
    restart
}
