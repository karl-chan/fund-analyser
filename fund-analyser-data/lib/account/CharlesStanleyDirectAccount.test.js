const CharlesStanleyDirectAccount = require('./CharlesStanleyDirectAccount')
const CharlesStanleyDirectAuth = require('../auth/CharlesStanleyDirectAuth')
const properties = require('../util/properties')

jest.setTimeout(30000) // 30 seconds

describe('CharlesStanleyDirectAccount', () => {
    let csdAccount, jar
    beforeAll(async () => {
        const user = properties.get('fund.charlesstanleydirect.user')
        const pass = properties.get('fund.charlesstanleydirect.pass')
        const memorableWord = properties.get('fund.charlesstanleydirect.memorableWord')
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
