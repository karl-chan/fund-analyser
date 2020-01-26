module.exports = {
    push
}

const Promise = require('bluebird')
const webpush = require('web-push')
const SessionDAO = require('../db/SessionDAO')
const log = require('./log')
const properties = require('./properties')

const vapidSubject = `mailto: ${properties.get('heroku.username')}`

webpush.setVapidDetails(
    vapidSubject,
    properties.get('vapid.key.public'),
    properties.get('vapid.key.private')
)

async function push (user, key, payload) {
    const sessions = await SessionDAO.findSessionsForUser(user)
    const pushSubscriptions = sessions.map(s => s.pushSubscription)

    await Promise.map(pushSubscriptions, async pushSubscription => {
        try {
            await webpush.sendNotification(pushSubscription, JSON.stringify({
                key,
                payload
            }))
        } catch (err) {
            log.error(`Failed for pushSubscription: ${JSON.stringify(pushSubscription)}. Cause: ${err}`)
        }
    })
}
