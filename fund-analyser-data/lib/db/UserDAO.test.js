const UserDAO = require('./UserDAO.js')

const db = require('../util/db.js')

describe('UserDAO', function () {
    let entry, dao, user, meta
    beforeAll(async () => {
        await db.init()
    })
    afterAll(async () => {
        await db.close()
    })
    beforeEach(function () {
        entry = {
            user: 'user',
            meta: {
                watchlist: ['isin1', 'isin2']
            }
        }
        dao = new UserDAO(entry)
        user = 'user'
        meta = {
            watchlist: ['isin1', 'isin2']
        }
    })
    test('copy constructor', function () {
        expect(dao).toHaveProperty('user', 'user')
        expect(dao).toHaveProperty('meta', meta)
    })
    test('serialise', function () {
        const result = UserDAO.serialise(user, meta)
        expect(result).toEqual(entry)
    })
    test('deserialise', function () {
        const result = UserDAO.deserialise(entry)
        expect(result).toEqual({user, meta})
    })
    test('watchlist', async function () {
        await UserDAO.deleteUser(user)

        await UserDAO.createUserIfNotExists(user)
        let watchlist = await UserDAO.getWatchlist(user)
        expect(watchlist).toEqual([])

        await UserDAO.addToWatchlist(user, 'isin1')
        await UserDAO.addToWatchlist(user, 'isin2')
        watchlist = await UserDAO.getWatchlist(user)
        expect(watchlist).toEqual(['isin1', 'isin2'])

        await UserDAO.removeFromWatchlist(user, 'isin1')
        watchlist = await UserDAO.getWatchlist(user)
        expect(watchlist).toEqual(['isin2'])

        await UserDAO.clearWatchlist(user)
        watchlist = await UserDAO.getWatchlist(user)
        expect(watchlist).toEqual([])

        await UserDAO.deleteUser(user)
    })
})
