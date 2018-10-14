const moment = require('moment')
const _ = require('lodash')
const CharlesStanleyDirectAccount = require('./CharlesStanleyDirectAccount')
const CharlesStanleyDirectAuth = require('../auth/CharlesStanleyDirectAuth')
const db = require('../util/db')
const properties = require('../util/properties')

jest.setTimeout(30000) // 30 seconds

describe('CharlesStanleyDirectAccount', () => {
    let csdAccount, jar
    beforeAll(async () => {
        const user = properties.get('fund.charlesstanleydirect.user')
        const pass = properties.get('fund.charlesstanleydirect.pass')
        const memorableWord = properties.get('fund.charlesstanleydirect.memorableWord')
        ;({ jar } = await new CharlesStanleyDirectAuth().login(user, pass, memorableWord))
        expect(jar).toBeTruthy()

        await db.init()
    })
    beforeEach(() => {
        csdAccount = new CharlesStanleyDirectAccount(jar)
    })
    afterAll(async () => {
        await db.close()
    })
    test('getBalance should return account balance', async () => {
        const { portfolio, cash, totalValue, holdings } = await csdAccount.getBalance()
        expect(portfolio).not.toBeNegative()
        expect(cash).toBeNumber()
        expect(totalValue).toBePositive()
        expect(holdings).toBeArray()
    })
    test('getStatement should return account statement', async () => {
        const statement = await csdAccount.getStatement()
        expect(statement).toBeObject()
        expect(statement.series).toBeArray().not.toBeEmpty()
        expect(statement.events).toSatisfyAll(event => {
            switch (event.type) {
            case 'fund':
                const from = moment(event.from)
                const to = moment(event.to)
                return from.isValid() && to.isValid() && from.isSameOrBefore(to) &&
                    event.holdings.every(h => typeof h.sedol === 'string' && h.sedol && typeof h.weight === 'number' && h.weight > 0)
            case 'fee': // fallthrough
            case 'deposit': // fallthrough
            case 'withdrawal':
                return typeof event.value === 'number' && event.value > 0
            default:
                return false
            }
        })
        expect(_.zip(statement.series.slice(0, statement.series.length - 1), statement.series.slice(1))).toSatisfyAll(([hp1, hp2]) => {
            const neighbouringDaysDiff = moment.utc(hp2.date).diff(hp1.date, 'days')
            // weekdays or weekends
            return (neighbouringDaysDiff === 1 || neighbouringDaysDiff === 3) && typeof hp1.price === 'number'
        })
    })
})
