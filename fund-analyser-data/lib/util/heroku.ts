
import moment from 'moment'
import * as properties from './properties'
import * as streamWrapper from './streamWrapper'
import Http from './http'
import log from './log'
import * as _ from 'lodash'
const Heroku = require('heroku-client')

const http = new Http()

// list of categories
export const WEB_CATEGORY = 'web'
export const WORKER_CATEGORY = 'worker'
export const COMPUTE_CATEGORY = 'compute'

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

export async function getLogs (category: any, lines: any) {
  const url = await getLogplexUrl(category, false, lines)
  const { body } = await http.asyncGet(url)
  return body
}

export async function getLastActivity (category: any) {
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
  const logs = await getLogs(category)
  try {
    const lines = logs.split('\n')
    const lastLine = _.findLast(lines, (line: any) => {
      return !_.isEmpty(line) && moment(line.split(' ')[0]).isValid()
    })
    return moment(lastLine.split(' ')[0])
  } catch (err) {
    log.error('Failed to get latest timestamp from logs. Cause: %s', err.stack)
    return undefined
  }
}

export async function getLogplexUrl (category: any, stream = false, lines = 1500) {
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

export async function streamLogs (category: any) {
  const url = await getLogplexUrl(category, true)
  const bufferToStringStream = streamWrapper.asTransformAsync((buf: any) => buf.toString('utf-8'))
  return http.stream(url).pipe(bufferToStringStream)
}

export async function restart (category: any) {
  const { appName, herokuClient } = getClient(category)
  await herokuClient.delete(`/apps/${appName}/dynos/${category}`)
}

const getClient = (category: any) => {
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  return clients[category]
}
