import { CookieJar } from 'tough-cookie'
import CharlesSchwabAuth from '../auth/CharlesSchwabAuth'
import * as properties from '../util/properties'
import CharlesSchwabAccount from './CharlesSchwabAccount'

jest.setTimeout(120000) // 2 minutes

describe('CharlesSchwabAccount', () => {
  let schwabAccount: CharlesSchwabAccount, jar: CookieJar
  beforeAll(async () => {
    const user = properties.get('stock.charlesschwab.user')
    const pass = properties.get('stock.charlesschwab.pass')
        ;({ jar } = await new CharlesSchwabAuth(undefined).login(user, pass))
    expect(jar).toBeTruthy()
  })
  beforeEach(() => {
    schwabAccount = new CharlesSchwabAccount(jar)
  })

  test('getBalance should return account balance', async () => {
    const { cash, totalValue } = await schwabAccount.getBalance()
    expect(cash).toBeNumber().not.toBeNaN()
    expect(totalValue).toBePositive()
  })
})
