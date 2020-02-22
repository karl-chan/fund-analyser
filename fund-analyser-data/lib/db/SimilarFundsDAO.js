module.exports = {
    getSimilarFunds,
    upsertSimilarFunds
}

const db = require('../util/db')
const log = require('../util/log')

async function getSimilarFunds (isins) {
    const query = { isin: { $in: isins } }
    const projection = { _id: 0 }
    return db.getSimilarFunds().find(query, { projection }).toArray()
}

async function upsertSimilarFunds (similarFunds) {
    const operations = similarFunds.map(similarFundEntry => {
        return {
            replaceOne: {
                filter: { isin: similarFundEntry.isin },
                replacement: similarFundEntry,
                upsert: true
            }
        }
    })
    await db.getSimilarFunds().bulkWrite(operations)
    log.debug(`Upserted similar funds for isins: ${similarFunds.map(similarFundEntry => similarFundEntry.isin)}`)
}
