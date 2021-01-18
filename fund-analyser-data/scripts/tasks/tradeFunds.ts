import { Promise } from 'bluebird'
import moment from 'moment'
import CharlesStanleyDirectAccount from '../../lib/account/CharlesStanleyDirectAccount'
import CharlesStanleyDirectAuth from '../../lib/auth/CharlesStanleyDirectAuth'
import SessionDAO from '../../lib/db/SessionDAO'
import UserDAO from '../../lib/db/UserDAO'
import trade from '../../lib/trade/trade'
import log from '../../lib/util/log'
import * as security from '../../lib/util/security'
/**
 * Algo trading for users.
 */
export default async function tradeFunds () {
  const docs = await UserDAO.listUsers()
  await Promise.map(docs, doc => tradeFundsForUser(doc.user))
}
async function tradeFundsForUser (user: any) {
  const [simulateParams, sessions] = await Promise.all([
    UserDAO.getSimulateParams(user),
    SessionDAO.findSessionsForUser(user)
  ])
  // Only trade for first active simulate params
  const activeSimulateParam = simulateParams.find((simulateParam: any) => simulateParam.active)
  if (!activeSimulateParam) {
    log.info(`There is no active simulateParam for user ${user}. Aborting trade.`)
    return
  }
  const activeSession = sessions.find((session: any) => moment(session.token.expiry).isAfter())
  if (!activeSession) {
    throw new Error(`There is no active session for ${user}. Aborting trade.`)
  }
  const pass = security.decryptString(activeSession.token.pass)
  const memorableWord = security.decryptString(activeSession.token.memorableWord)
  const { jar } = await new CharlesStanleyDirectAuth().login(user, pass, memorableWord)
  const csdAccount = new CharlesStanleyDirectAccount(jar, pass)
  const orderReference = await trade(activeSimulateParam, { csdAccount })
  log.info(`Successfully executed trades for user ${user} with simulateParam: ${JSON.stringify(activeSimulateParam)}. Order reference: ${orderReference}`)
}
