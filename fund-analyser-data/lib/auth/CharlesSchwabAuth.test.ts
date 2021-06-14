import { CookieJar } from 'tough-cookie'
import * as properties from '../util/properties'
import CharlesSchwabAuth from './CharlesSchwabAuth'

jest.setTimeout(120000) // 2 minutes

describe('CharlesSchwabAuth', () => {
  let schwabAuth: CharlesSchwabAuth, user: string, pass: string
  beforeAll(() => {
    user = properties.get('stock.charlesschwab.user')
    pass = properties.get('stock.charlesschwab.pass')
  })
  beforeEach(() => {
    schwabAuth = new CharlesSchwabAuth(undefined)
  })
  test('login should be successful with valid user and pass', async () => {
    const { jar } = await schwabAuth.login(user, pass)
    const isLoggedIn = await schwabAuth.isLoggedIn({ jar })
    expect(isLoggedIn).toBeTrue()
  })

  test('login should fail with invalid user or pass', async () => {
    try {
      await schwabAuth.login('fakeUser', 'fakePass')
      throw new Error('Should not reach here - login should fail')
    } catch (err) {
      expect(err)
        .toBeInstanceOf(Error)
        .toHaveProperty('message', 'Incorrect username or password')
    }
  })

  test('isLoggedIn should return false when logged out', async () => {
    const jar = new CookieJar()
    const isLoggedIn = await schwabAuth.isLoggedIn({ jar })
    expect(isLoggedIn).toBeFalse()
  })
})
