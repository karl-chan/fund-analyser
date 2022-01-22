import moment from 'moment'
import * as heroku from '../../lib/util/heroku'
import { Category } from '../../lib/util/heroku'
import log from '../../lib/util/log'

const idleThreshold = moment.duration(5, 'minutes')

/**
 * Performs health check on running heroku dynos. If stuck, restart them.
 */
export default async function dynoHealthcheck () {
  const lastActivity = await heroku.getLastActivity(Category.WORKER_CATEGORY)

  const cutoffTime = moment().subtract(idleThreshold)
  if (!lastActivity || lastActivity.isBefore(cutoffTime)) {
    log.info('Restarting dyno since last activity was %s', lastActivity.toString())
    await heroku.restart(Category.WORKER_CATEGORY)
  }
}
