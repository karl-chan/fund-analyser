const SessionDAO = require('./SessionDAO.js')

const db = require('../util/db.js')

describe('SessionDAO', function () {
    let entry, dao, data, sessionId
    beforeAll(async () => {
        await db.init()
    })
    afterAll(async () => {
        await db.close()
    })
    beforeEach(function () {
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
    test('copy constructor', function () {
        expect(dao).toHaveProperty('user', 'user')
        expect(dao).toHaveProperty('pass', 'pass')
        expect(dao).toHaveProperty('memorableWord', 'memorableWord')
    })
    test('serialise', function () {
        const result = SessionDAO.serialise(data, sessionId)
        expect(result).toEqual(entry)
    })
    test('deserialise', function () {
        const result = SessionDAO.deserialise(entry)
        expect(result).toEqual({data, sessionId})
    })
    test('upsertSession, findSession and deleteSession', async function () {
        await SessionDAO.upsertSession(data, sessionId)
        let retrievedSession = await SessionDAO.findSession(sessionId)
        expect(retrievedSession).toMatchObject(data)

        await SessionDAO.deleteSession(sessionId)
        retrievedSession = await SessionDAO.findSession(sessionId)
        expect(retrievedSession).toBeNull()
    })
})
