const CharlesStanleyDirectAccount = require('./CharlesStanleyDirectAccount')
const CharlesStanleyDirectAuth = require('../auth/CharlesStanleyDirectAuth')

jest.setTimeout(30000) // 30 seconds

describe('CharlesStanleyDirectAccount', () => {
    let csdAccount, jar
    beforeAll(async () => {
        const { user, pass, memorableWord } = global.jestSecrets.charlesStanleyDirect
        ;({jar} = await new CharlesStanleyDirectAuth().login(user, pass, memorableWord))
        expect(jar).toBeTruthy()
    })
    beforeEach(() => {
        csdAccount = new CharlesStanleyDirectAccount(jar)
    })
    test('getBalance should return account balance', async () => {
        const {portfolio, cash, totalValue, holdings} = await csdAccount.getBalance()
        expect(portfolio).not.toBeNegative()
        expect(cash).toBeNumber()
        expect(totalValue).toBePositive()
        expect(holdings).toBeArray()
    })
})
