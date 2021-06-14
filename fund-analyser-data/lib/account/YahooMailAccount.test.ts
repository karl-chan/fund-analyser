import { CookieJar } from 'tough-cookie'
import YahooAuth from '../auth/YahooAuth'
import * as properties from '../util/properties'
import YahooMailAccount from './YahooMailAccount'

jest.setTimeout(30000) // 30 seconds

describe('YahooMailAccount', () => {
  let yahooMailAccount: YahooMailAccount, jar: CookieJar
  beforeAll(async () => {
    const user = properties.get('mail.yahoo.user')
    const pass = properties.get('mail.yahoo.pass')
        ;({ jar } = await new YahooAuth().login(user, pass))
    expect(jar).toBeTruthy()
  })
  beforeEach(() => {
    yahooMailAccount = new YahooMailAccount(jar)
  })
  test('listRecentMessages should return messages', async () => {
    const messages = await yahooMailAccount.listRecentMessages()
    expect(messages).not.toBeEmpty()
  })
})
