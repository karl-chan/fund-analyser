import { Promise } from 'bluebird'
import UserDAO from '../../lib/db/UserDAO'
import * as simulate from '../../lib/simulate/simulate'
/**
 * Pushes notifications to users.
 */
export default async function pushNotifications () {
  const docs = await UserDAO.listUsers()
  await Promise.map(docs, doc => simulate.pushNotificationsForUser(doc.user))
}
