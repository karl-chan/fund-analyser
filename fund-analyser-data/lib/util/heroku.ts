
import * as _ from 'lodash'
import moment from 'moment'
import Http from './http'
import log from './log'
import * as properties from './properties'
import * as streamWrapper from './streamWrapper'
const Heroku = require('heroku-client')

const http = new Http()

// list of categories
export enum Category {
  WEB_CATEGORY = 'web',
  WORKER_CATEGORY = 'worker',
  COMPUTE_CATEGORY = 'compute'
}

const clients = {
  [Category.WEB_CATEGORY]: {
    appName: properties.get('heroku.app.name'),
    herokuClient: new Heroku({ token: properties.get('heroku.api.token') }),
    dyno: 'web'
  },
  [Category.WORKER_CATEGORY]: {
    appName: properties.get('heroku.app.name.data'),
    herokuClient: new Heroku({ token: properties.get('heroku.api.token.data') }),
    dyno: 'worker'
  },
  [Category.COMPUTE_CATEGORY]: {
    appName: properties.get('heroku.app.name.compute'),
    herokuClient: new Heroku({ token: properties.get('heroku.api.token.compute') }),
    dyno: 'web'
  }
}

export async function getLogs (category: Category, lines?: any) {
  const url = await getLogplexUrl(category, false, lines)
  const { data } = await http.asyncGet(url)
  return data
}

export async function getLastActivity (category: Category) {
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

export async function getLogplexUrl (category: Category, stream = false, lines = 1500) {
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

export async function streamLogs (category: Category) {
  const url = await getLogplexUrl(category, true)
  const bufferToStringStream = streamWrapper.asTransformAsync(buf => buf.toString('utf-8'))
  const stream = await http.stream(url)
  return stream.pipe(bufferToStringStream)
}

export async function restart (category: Category) {
  const { appName, herokuClient } = getClient(category)
  await herokuClient.delete(`/apps/${appName}/dynos/${category}`)
}

const getClient = (category: Category) => {
  return clients[category]
}
