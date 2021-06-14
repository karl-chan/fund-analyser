import { CookieJar } from 'tough-cookie'
import * as properties from '../util/properties'
import YahooAuth from './YahooAuth'

jest.setTimeout(30000) // 30 seconds

describe('YahooAuth', () => {
  let yahooAuth: YahooAuth, user: string, pass: string
  beforeAll(() => {
    user = properties.get('mail.yahoo.user')
    pass = properties.get('mail.yahoo.pass')
  })
  beforeEach(() => {
    yahooAuth = new YahooAuth()
  })
  test('login should be successful with valid user and pass', async () => {
    const { jar } = await yahooAuth.login(user, pass)
    expect(jar).toBeInstanceOf(CookieJar)

    const isLoggedIn = await yahooAuth.isLoggedIn({ jar })
    expect(isLoggedIn).toBeTrue()
  })

  test('login should fail with invalid user or pass', async () => {
    user = 'fakeUser'
    try {
      await yahooAuth.login(user, pass)
      throw new Error('Should not reach here - login should fail')
    } catch (err) {
      expect(err)
        .toBeInstanceOf(Error)
        .toHaveProperty('message', 'Incorrect username or password')
    }
  })
})
