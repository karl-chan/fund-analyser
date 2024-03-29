import { ObjectId } from 'mongodb'
import * as webpush from 'web-push'
import SessionDAO from '../db/SessionDAO'
import push from './push'

jest.mock('../db/SessionDAO')
jest.mock('web-push')
const MockedSessionDAO = SessionDAO as jest.Mocked<typeof SessionDAO>

describe('push', () => {
  test('should push notifications for user', async () => {
    const user = 'user'
    const key = 'trade'
    const payload = 'payload'
    const pushSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/ea1UhsYdxuI:APA91bFDmp9UULWBo5bGaggUtNO4BKi1ybfTm5PS9WDt-V0gM4nWw0HonmbIs22yAOxEqNl0j8JaESIc83HEP-LP0NwMGcN4Zk9TouRzcxMRMVUJDXChUuM5pU8Sa581f8fy5Oy-A_tI',
      expirationTime: null as Date,
      keys: {
        p256dh: 'BMQ7JIG9Ej31vjvEuXBjMFV0FfsX_qKAx0rW8PbdueaVbE_-fYWDaXm4S6w-NOI1mu6347gZOUHdL80pqufgllE',
        auth: 'nOz1b9_cyjKfOkyefF600Q'
      }
    }
    const sessions = [
      {
        _id: new ObjectId(),
        token: { user: 'user' },
        pushSubscription,
        sessionId: 'fa28101a-4ad5-44ea-af7d-ed1dac08a7e0'
      }
    ]
    MockedSessionDAO.findSessionsForUser.mockResolvedValue(sessions)
    await push(user, key, payload)
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      pushSubscription,
      JSON.stringify({ key, payload }))
  })
})
