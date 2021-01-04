// writes to tmp storage
// put everything in /tmp/fund-analyser

import * as os from 'os'
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'fs'.
import * as fs from 'fs-extra'
import * as path from 'path'
import moment from 'moment'

const APP_FOLDER = 'fund-analyser'
const tmp = path.join(os.tmpdir(), APP_FOLDER)

/**
 * Read object from /tmp/<key> file. Throws error if doesn't exist or expired.
 * @param {string} key
 */
export async function read (key: any) {
  const location = path.join(tmp, key)
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
export async function write (key: any, object: any, expirySeconds: any) {
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
