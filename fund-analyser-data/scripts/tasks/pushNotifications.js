module.exports = pushNotifications

const Promise = require('bluebird')
const UserDAO = require('../../lib/db/UserDAO')
const simulate = require('../../lib/simulate/simulate')

/**
 * Pushes notifications to users.
 */
async function pushNotifications () {
    const docs = await UserDAO.listUsers()
    await Promise.map(docs, doc => simulate.pushNotificationsForUser(doc.user)
    )
}
