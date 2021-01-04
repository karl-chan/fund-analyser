import { Promise } from 'bluebird'
import UserDAO from '../../lib/db/UserDAO'
import * as simulate from '../../lib/simulate/simulate'
/**
 * Pushes notifications to users.
 */
export default async function pushNotifications () {
  const docs = await UserDAO.listUsers()
  await (Promise as any).map(docs, (doc: any) => simulate.pushNotificationsForUser(doc.user))
}
