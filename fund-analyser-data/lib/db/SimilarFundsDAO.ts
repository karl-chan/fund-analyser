import * as db from '../util/db'
import log from '../util/log'

export async function getSimilarFunds (isins: string[]) {
  const query = { isin: { $in: isins } }
  const projection = { _id: 0 }
  return db.getSimilarFunds().find(query, { projection }).toArray()
}

export async function upsertSimilarFunds (similarFunds: any) {
  const operations = similarFunds.map((similarFundEntry: any) => {
    return {
      replaceOne: {
        filter: { isin: similarFundEntry.isin },
        replacement: similarFundEntry,
        upsert: true
      }
    }
  })
  await db.getSimilarFunds().bulkWrite(operations)
  log.debug(`Upserted similar funds for isins: ${similarFunds.map((similarFundEntry: any) => similarFundEntry.isin)}`)
}
