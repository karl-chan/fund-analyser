import { Promise } from 'bluebird'
import * as db from '../../lib/util/db'
/**
 * Reclaims unused disk space in database
 */
export default async function repairDatabase () {
  const { mainDb, fundDbs } = db.get()
  return (Promise as any).map([mainDb, ...fundDbs], (db: any) => db.command({ repairDatabase: 1 }))
}
