const SessionDAO = require('./SessionDAO.js')

const db = require('../util/db.js')
const chai = require('chai')
const chaiThings = require('chai-things')
chai.should()
chai.use(chaiThings)
const assert = chai.assert

describe('SessionDAO', function () {
    let entry, dao, data, sessionId
    before(async () => {
        db.init()
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
    it('copy constructor', function () {
        assert.equal(dao.user, 'user')
        assert.equal(dao.pass, 'pass')
        assert.equal(dao.memorableWord, 'memorableWord')
    })
    it('serialise', function () {
        const result = SessionDAO.serialise(data, sessionId)
        assert.deepEqual(result, entry)
    })
    it('deserialise', function () {
        const result = SessionDAO.deserialise(entry)
        assert.deepEqual(result, data)
    })
    it('upsertSession, fetchSession and deleteSession', async function () {
        await SessionDAO.upsertSession(data, sessionId)
        let retrievedSession = await SessionDAO.fetchSession(sessionId)
        assert.deepEqual(retrievedSession, data)

        await SessionDAO.deleteSession(sessionId)
        retrievedSession = await SessionDAO.fetchSession(sessionId)
        assert.isNull(retrievedSession)
    })
})
