const CharlesStanleyDirectAuth = require('./CharlesStanleyDirectAuth')
const properties = require('../util/properties')

jest.setTimeout(30000) // 30 seconds

describe('CharlesStanleyDirectAuth', () => {
    let csdAuth, user, pass, memorableWord
    beforeAll(() => {
        user = properties.get('fund.charlesstanleydirect.user')
        pass = properties.get('fund.charlesstanleydirect.pass')
        memorableWord = properties.get('fund.charlesstanleydirect.memorableWord')
    })
    beforeEach(() => {
        csdAuth = new CharlesStanleyDirectAuth()
    })
    test('login should be successful with valid user, pass and memorable word', async () => {
        const {jar, name} = await csdAuth.login(user, pass, memorableWord)
        expect(jar).toBeTruthy()
        expect(name).toBeString().not.toBeEmpty()

        const isLoggedIn = await csdAuth.isLoggedIn({jar})
        expect(isLoggedIn).toBeTrue()
    })

    test('login should fail with invalid user, pass or memorableWord', async () => {
        user = 'fakeUser'
        try {
            await csdAuth.login(user, pass, memorableWord)
            throw new Error('Should not reach here - login should fail')
        } catch (err) {
            expect(err)
                .toBeInstanceOf(Error)
                .toHaveProperty('message', 'Incorrect username or password')
        }
    })
})
