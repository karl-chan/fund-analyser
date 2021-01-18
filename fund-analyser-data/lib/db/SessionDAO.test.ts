import * as db from '../util/db'
import SessionDAO from './SessionDAO'


jest.setTimeout(30000) // 30 seconds

describe('SessionDAO', () => {
  let data: any, sessionId: string
  beforeAll(async () => {
    await db.init()
  })
  afterAll(async () => {
    await db.close()
  })
  beforeEach(() => {
    data = {
      user: 'user',
      pass: 'pass',
      memorableWord: 'memorableWord'
    }
    sessionId = 'TEST'
  })
  test('upsertSession, findSession and deleteSession', async () => {
    await SessionDAO.upsertSession(data, sessionId)
    let retrievedSession = await SessionDAO.findSession(sessionId)
    expect(retrievedSession).toMatchObject(data)

    await SessionDAO.deleteSession(sessionId)
    retrievedSession = await SessionDAO.findSession(sessionId)
    expect(retrievedSession).toBeNull()
  })
  test('upsertBackgroundSession and deleteBackgroundSession', async () => {
    await SessionDAO.upsertBackgroundSession(data)
    let retrievedSessions = await SessionDAO.findSessionsForUser(data.user)
    expect(retrievedSessions).toContainEqual(
      expect.objectContaining(
        {
          token: {
            ...data,
            expiry: new Date(9999, 0, 1),
            userAgent: 'Background Session'
          }
        }
      )
    )

    await SessionDAO.deleteBackgroundSession(data.user)
    retrievedSessions = await SessionDAO.findSessionsForUser(data.user)
    expect(retrievedSessions).toBeEmpty()
  })
})
