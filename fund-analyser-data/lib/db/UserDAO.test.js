const UserDAO = require('./UserDAO')

const db = require('../util/db')

jest.setTimeout(30000) // 30 seconds

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
        expect(result).toEqual({ user, meta })
    })
    test('listUsers', async function () {
        await UserDAO.deleteUser(user)

        await UserDAO.createUserIfNotExists(user)
        const result = await UserDAO.listUsers()
        expect(result).toBeArray().not.toBeEmpty()
        expect(result).toSatisfyAll(user => user.user && user.meta)

        await UserDAO.deleteUser(user)
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
    test('currencies', async function () {
        await UserDAO.deleteUser(user)

        await UserDAO.createUserIfNotExists(user)
        let currencies = await UserDAO.getCurrencies(user)
        expect(currencies).toEqual([])

        await UserDAO.addToCurrencies(user, 'GBPUSD')
        await UserDAO.addToCurrencies(user, 'EURHKD')
        currencies = await UserDAO.getCurrencies(user)
        expect(currencies).toEqual(['GBPUSD', 'EURHKD'])

        await UserDAO.removeFromCurrencies(user, 'GBPUSD')
        currencies = await UserDAO.getCurrencies(user)
        expect(currencies).toEqual(['EURHKD'])

        await UserDAO.removeFromCurrencies(user, 'EURHKD')
        currencies = await UserDAO.getCurrencies(user)
        expect(currencies).toEqual([])

        await UserDAO.deleteUser(user)
    })
    test('simulateParams', async function () {
        await UserDAO.deleteUser(user)

        await UserDAO.createUserIfNotExists(user)
        let simulateParams = await UserDAO.getSimulateParams(user)
        expect(simulateParams).toEqual([])

        await UserDAO.addToSimulateParams(user, { strategy: 'BollingerReturns', num_portfolio: 1 })
        await UserDAO.addToSimulateParams(user, { strategy: 'PriceChannelReturns', isins: ['GB0006061963'] })
        simulateParams = await UserDAO.getSimulateParams(user)
        expect(simulateParams).toEqual([
            { strategy: 'BollingerReturns', num_portfolio: 1 },
            { strategy: 'PriceChannelReturns', isins: ['GB0006061963'] }
        ])

        await UserDAO.removeFromSimulateParams(user, { strategy: 'BollingerReturns', num_portfolio: 1 })
        simulateParams = await UserDAO.getSimulateParams(user)
        expect(simulateParams).toEqual([
            { strategy: 'PriceChannelReturns', isins: ['GB0006061963'] }
        ])

        await UserDAO.removeFromSimulateParams(user, { strategy: 'PriceChannelReturns', isins: ['GB0006061963'] })
        simulateParams = await UserDAO.getSimulateParams(user)
        expect(simulateParams).toEqual([])

        await UserDAO.deleteUser(user)
    })
})
