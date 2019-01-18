
const properties = require('./properties')
const streamWrapper = require('./streamWrapper')
const Http = require('./http')
const log = require('./log')
const Heroku = require('heroku-client')
const _ = require('lodash')
const moment = require('moment')

const http = new Http()

// list of recognisable dynos
const WEB_DYNO = 'web'
const WORKER_DYNO = 'worker'

const clients = {
    [WEB_DYNO]: {
        appName: properties.get('heroku.app.name'),
        herokuClient: new Heroku({ token: properties.get('heroku.api.token') })
    },
    [WORKER_DYNO]: {
        appName: properties.get('heroku.app.name.data'),
        herokuClient: new Heroku({ token: properties.get('heroku.api.token.data') })
    }
}

async function getLogs (dyno = WORKER_DYNO) {
    const url = await getLogplexUrl(dyno)
    const { body } = await http.asyncGet(url)
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

async function getLogplexUrl (dyno, stream = false) {
    const { appName, herokuClient } = getClient(dyno)
    const res = await herokuClient.post(`/apps/${appName}/log-sessions`, {
        body: {
            dyno,
            lines: 1500,
            tail: stream
        }
    })
    return res.logplex_url
}

async function streamLogs (dyno = WORKER_DYNO) {
    const url = await getLogplexUrl(dyno, true)
    const bufferToStringStream = streamWrapper.asTransformAsync(buf => buf.toString('utf-8'))
    http.stream(url).pipe(bufferToStringStream)
    return bufferToStringStream
}

async function restart (dyno = WORKER_DYNO) {
    const { appName, herokuClient } = getClient(dyno)
    await herokuClient.delete(`/apps/${appName}/dynos/${dyno}`)
}

const getClient = dyno => {
    return clients[dyno]
}

module.exports = {
    getLogs,
    getLastActivity,
    getLogplexUrl,
    streamLogs,
    restart
}
