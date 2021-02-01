import * as db from '../util/db'
import UserDAO from './UserDAO'

jest.setTimeout(30000) // 30 seconds

describe('UserDAO', function () {
  let user: any
  beforeAll(async () => {
    await db.init()
  })
  afterAll(async () => {
    await db.close()
  })
  beforeEach(function () {
    user = 'user'
  })

  test('listUsers', async function () {
    await UserDAO.deleteUser(user)

    await UserDAO.createUserIfNotExists(user)
    const result = await UserDAO.listUsers()
    expect(result).toBeArray().not.toBeEmpty()
    expect(result).toSatisfyAll((user: any) => user.user && user.meta)

    await UserDAO.deleteUser(user)
  })
  test('fundWatchlist', async function () {
    await UserDAO.deleteUser(user)

    await UserDAO.createUserIfNotExists(user)
    let fundWatchlist = await UserDAO.getFundWatchlist(user)
    expect(fundWatchlist).toEqual([])

    await UserDAO.addToFundWatchlist(user, 'isin1')
    await UserDAO.addToFundWatchlist(user, 'isin2')
    fundWatchlist = await UserDAO.getFundWatchlist(user)
    expect(fundWatchlist).toEqual(['isin1', 'isin2'])

    await UserDAO.removeFromFundWatchlist(user, 'isin1')
    fundWatchlist = await UserDAO.getFundWatchlist(user)
    expect(fundWatchlist).toEqual(['isin2'])

    await UserDAO.clearFundWatchlist(user)
    fundWatchlist = await UserDAO.getFundWatchlist(user)
    expect(fundWatchlist).toEqual([])

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

    await UserDAO.addToSimulateParams(user, { strategy: 'BollingerReturns', numPortfolio: 1 })
    await UserDAO.addToSimulateParams(user, { strategy: 'PriceChannelReturns', isins: ['GB0006061963'], numPortfolio: 2 })
    simulateParams = await UserDAO.getSimulateParams(user)
    expect(simulateParams).toEqual([
      { strategy: 'BollingerReturns', numPortfolio: 1 },
      { strategy: 'PriceChannelReturns', isins: ['GB0006061963'], numPortfolio: 2 }
    ])

    await UserDAO.activateSimulateParam(user, { strategy: 'BollingerReturns', numPortfolio: 1 })
    simulateParams = await UserDAO.getSimulateParams(user)
    expect(simulateParams).toEqual([
      { strategy: 'BollingerReturns', numPortfolio: 1, active: true },
      { strategy: 'PriceChannelReturns', isins: ['GB0006061963'], numPortfolio: 2 }
    ])

    await UserDAO.deactivateAllSimulateParams(user)
    simulateParams = await UserDAO.getSimulateParams(user)
    expect(simulateParams).toEqual([
      { strategy: 'BollingerReturns', numPortfolio: 1 },
      { strategy: 'PriceChannelReturns', isins: ['GB0006061963'], numPortfolio: 2 }
    ])

    await UserDAO.removeFromSimulateParams(user, { strategy: 'BollingerReturns', numPortfolio: 1 })
    simulateParams = await UserDAO.getSimulateParams(user)
    expect(simulateParams).toEqual([
      { strategy: 'PriceChannelReturns', isins: ['GB0006061963'], numPortfolio: 2 }
    ])

    await UserDAO.removeFromSimulateParams(user, { strategy: 'PriceChannelReturns', isins: ['GB0006061963'], numPortfolio: 2 })
    simulateParams = await UserDAO.getSimulateParams(user)
    expect(simulateParams).toEqual([])

    await UserDAO.deleteUser(user)
  })
})
