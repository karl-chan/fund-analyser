import { Promise } from 'bluebird'
import webpush from 'web-push'
import SessionDAO from '../db/SessionDAO'
import log from './log'
import * as properties from './properties'

const vapidSubject = `mailto: ${properties.get('heroku.username')}`
webpush.setVapidDetails(vapidSubject, properties.get('vapid.key.public'), properties.get('vapid.key.private'))

export default async function push (user: any, key: any, payload: any) {
  const sessions = await SessionDAO.findSessionsForUser(user)
  const pushSubscriptions = sessions.map((s: any) => s.pushSubscription)
  await Promise.map(pushSubscriptions, async (pushSubscription: any) => {
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
