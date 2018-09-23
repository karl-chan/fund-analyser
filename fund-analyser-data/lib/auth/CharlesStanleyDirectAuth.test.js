const CharlesStanleyDirectAuth = require('./CharlesStanleyDirectAuth')

jest.setTimeout(30000) // 30 seconds

describe('CharlesStanleyDirectAuth', () => {
    let csdAuth, user, pass, memorableWord
    beforeEach(() => {
        csdAuth = new CharlesStanleyDirectAuth()
        ;({ user, pass, memorableWord } = global.jestSecrets.charlesStanleyDirect)
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
