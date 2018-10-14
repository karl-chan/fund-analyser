const SessionDAO = require('./SessionDAO')

const db = require('../util/db')

jest.setTimeout(30000) // 30 seconds

describe('SessionDAO', () => {
    let entry, dao, data, sessionId
    beforeAll(async () => {
        await db.init()
    })
    afterAll(async () => {
        await db.close()
    })
    beforeEach(() => {
        entry = {
            user: 'user',
            pass: 'pass',
            memorableWord: 'memorableWord',
            sessionId: 'TEST'
        }
        dao = new SessionDAO(entry)
        data = {
            user: 'user',
            pass: 'pass',
            memorableWord: 'memorableWord'
        }
        sessionId = 'TEST'
    })
    test('copy constructor', () => {
        expect(dao).toHaveProperty('user', 'user')
        expect(dao).toHaveProperty('pass', 'pass')
        expect(dao).toHaveProperty('memorableWord', 'memorableWord')
    })
    test('serialise', () => {
        const result = SessionDAO.serialise(data, sessionId)
        expect(result).toEqual(entry)
    })
    test('deserialise', () => {
        const result = SessionDAO.deserialise(entry)
        expect(result).toEqual({ data, sessionId })
    })
    test('upsertSession, findSession and deleteSession', async () => {
        await SessionDAO.upsertSession(data, sessionId)
        let retrievedSession = await SessionDAO.findSession(sessionId)
        expect(retrievedSession).toMatchObject(data)

        await SessionDAO.deleteSession(sessionId)
        retrievedSession = await SessionDAO.findSession(sessionId)
        expect(retrievedSession).toBeNull()
    })
})
