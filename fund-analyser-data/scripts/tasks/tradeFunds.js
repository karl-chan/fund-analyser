module.exports = tradeFunds

const Promise = require('bluebird')
const moment = require('moment')
const CharlesStanleyDirectAuth = require('../../lib/auth/CharlesStanleyDirectAuth')
const CharlesStanleyDirectAccount = require('../../lib/account/CharlesStanleyDirectAccount')
const SessionDAO = require('../../lib/db/SessionDAO')
const UserDAO = require('../../lib/db/UserDAO')
const trade = require('../../lib/trade/trade')
const log = require('../../lib/util/log')
const security = require('../../lib/util/security')

/**
 * Algo trading for users.
 */
async function tradeFunds () {
    const docs = await UserDAO.listUsers()
    await Promise.map(docs, doc => tradeFundsForUser(doc.user))
}

async function tradeFundsForUser (user) {
    const [simulateParams, sessions] = await Promise.all([
        UserDAO.getSimulateParams(user),
        SessionDAO.findSessionsForUser(user)
    ])

    // Only trade for first active simulate params
    const activeSimulateParam = simulateParams.find(simulateParam => simulateParam.active)
    if (!activeSimulateParam) {
        log.info(`There is no active simulateParam for user ${user}. Aborting trade.`)
        return []
    }

    const activeSession = sessions.find(session => moment(session.token.expiry).isAfter())
    if (!activeSession) {
        throw new Error(`There is no active session for ${user}. Aborting trade.`)
    }

    const pass = security.decryptString(activeSession.token.pass)
    const memorableWord = security.decryptString(activeSession.token.memorableWord)
    const { jar } = await new CharlesStanleyDirectAuth().login(user, pass, memorableWord)
    const csdAccount = new CharlesStanleyDirectAccount(jar, pass)

    const orderReference = await trade.trade(activeSimulateParam, { csdAccount })

    log.info(`Successfully executed trades for user ${user} with simulateParam: ${JSON.stringify(activeSimulateParam)}. Order reference: ${orderReference}`)
}
