const simulate = require('./simulate')
const { push } = require('../util/push')

jest.setTimeout(60000) // 60 seconds
jest.mock('../util/push')

describe('simulate', () => {
    test('simulate', async () => {
        const simulateParam = {
            strategy: 'BollingerReturns',
            isins: ['GB00B99C0657'],
            numPortfolio: 1
        }
        const simulation = await simulate.simulate(simulateParam)
        expect(simulation).toHaveProperty('statement',
            expect.toContainAllKeys([
                'series',
                'events',
                'returns'
            ]))
        expect(simulation.returns).toBeNumber()
        expect(simulation.maxDrawdown).toBeNumber()
        expect(simulation.sharpeRatio).toBeNumber()
        expect(simulation.startDate).toMatch(/\d{4}-\d{2}-\d{2}/)
        expect(simulation.endDate).toMatch(/\d{4}-\d{2}-\d{2}/)
    })

    test('predict', async () => {
        const simulateParam = {
            strategy: 'BollingerReturns',
            isins: ['GB00B99C0657'],
            numPortfolio: 1
        }
        const date = '2019-12-31'
        const prediction = await simulate.predict(simulateParam, date)
        expect(prediction).toEqual({
            date: '2019-12-31T00:00:00',
            funds: [{
                isin: 'GB00B99C0657',
                name: 'Legg Mason IF Japan Equity Fund Class X Accumulation (Hedged)'
            }]
        })
    })

    test('getStrategies', async () => {
        const strategies = await simulate.getStrategies()
        expect(strategies).toIncludeAllMembers(['BollingerReturns'])
    })

    test('pushNotificationsForUser', async () => {
        const user = 'user'
        const activeSimulateParam = {
            strategy: 'BollingerReturns',
            isins: ['GB00B99C0657'],
            numPortfolio: 1,
            trade: true
        }
        const inactiveSimulateParam = {
            strategy: 'BollingerReturns',
            isins: ['GB00B99C0657'],
            numPortfolio: 2
        }
        await simulate.pushNotificationsForUser([activeSimulateParam, inactiveSimulateParam], user)
        expect(push).toHaveBeenCalledTimes(1)
        expect(push).toHaveBeenCalledWith('user', 'trade',
            expect.toSatisfyAll(({ simulateParam, prediction }) => simulateParam && prediction))
    })
})
