
const properties = require('./properties')
const streamWrapper = require('./streamWrapper')
const Http = require('./http')
const log = require('./log')
const Heroku = require('heroku-client')
const _ = require('lodash')
const moment = require('moment')

const http = new Http()

// list of categories
const WEB_CATEGORY = 'web'
const WORKER_CATEGORY = 'worker'
const COMPUTE_CATEGORY = 'compute'

const clients = {
    [WEB_CATEGORY]: {
        appName: properties.get('heroku.app.name'),
        herokuClient: new Heroku({ token: properties.get('heroku.api.token') }),
        dyno: 'web'
    },
    [WORKER_CATEGORY]: {
        appName: properties.get('heroku.app.name.data'),
        herokuClient: new Heroku({ token: properties.get('heroku.api.token.data') }),
        dyno: 'worker'
    },
    [COMPUTE_CATEGORY]: {
        appName: properties.get('heroku.app.name.compute'),
        herokuClient: new Heroku({ token: properties.get('heroku.api.token.compute') }),
        dyno: 'web'
    }
}

async function getLogs (category, lines) {
    const url = await getLogplexUrl(category, false, lines)
    const { body } = await http.asyncGet(url)
    return body
}

async function getLastActivity (category) {
    const logs = await getLogs(category)
    try {
        const lines = logs.split('\n')
        const lastLine = _.findLast(lines, line => {
            return !_.isEmpty(line) && moment(line.split(' ')[0]).isValid()
        })
        return moment(lastLine.split(' ')[0])
    } catch (err) {
        log.error('Failed to get latest timestamp from logs. Cause: %s', err.stack)
        return undefined
    }
}

async function getLogplexUrl (category, stream = false, lines = 1500) {
    const { appName, herokuClient } = getClient(category)
    const res = await herokuClient.post(`/apps/${appName}/log-sessions`, {
        body: {
            dyno: herokuClient.dyno,
            lines,
            tail: stream
        }
    })
    return res.logplex_url
}

async function streamLogs (category) {
    const url = await getLogplexUrl(category, true)
    const bufferToStringStream = streamWrapper.asTransformAsync(buf => buf.toString('utf-8'))
    return http.stream(url).pipe(bufferToStringStream)
}

async function restart (category) {
    const { appName, herokuClient } = getClient(category)
    await herokuClient.delete(`/apps/${appName}/dynos/${category}`)
}

const getClient = category => {
    return clients[category]
}

module.exports = {
    getLogs,
    getLastActivity,
    getLogplexUrl,
    streamLogs,
    restart,
    WEB_CATEGORY,
    WORKER_CATEGORY,
    COMPUTE_CATEGORY
}
