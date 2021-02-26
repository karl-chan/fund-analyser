// writes to tmp storage
// put everything in /tmp/fund-analyser

import * as fs from 'fs-extra'
import moment from 'moment'
import * as os from 'os'
import * as path from 'path'
import log from './log'

const APP_FOLDER = 'fund-analyser'
const tmp = path.join(os.tmpdir(), APP_FOLDER)

/**
 * Read object from /tmp/<key> file. Throws error if doesn't exist or expired.
 * @param {string} key
 */
export async function read (key: string) {
  const location = path.join(tmp, key)
  log.debug(`Read tmp file at: ${location}`)
  const { expiry, object } = await fs.readJson(location)
  if (expiry < moment().unix()) {
    throw new Error(`Key already expired: ${key} at: ${expiry}`)
  }
  return object
}

/**
 * Write object into /tmp/<key> file, persisting for expiry seconds
 * @param {string} key
 */
export async function write (key: string, object: object, expirySeconds: number) {
  const location = path.join(tmp, key)
  const expiry = moment().add(expirySeconds, 'seconds').unix()
  return fs.outputJson(location, { expiry, object })
}

/**
 * Clears everything in /tmp
 */
export async function clear () {
  return fs.emptydir(tmp)
}
