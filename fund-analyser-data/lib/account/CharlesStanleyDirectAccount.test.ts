import * as _ from 'lodash'
import moment from 'moment'
import { CookieJar } from 'tough-cookie'
import CharlesStanleyDirectAuth from '../auth/CharlesStanleyDirectAuth'
import { Sell } from '../trade/Action'
import * as db from '../util/db'
import * as properties from '../util/properties'
import CharlesStanleyDirectAccount, { SeriesEvent } from './CharlesStanleyDirectAccount'

jest.setTimeout(30000) // 30 seconds

describe('CharlesStanleyDirectAccount', () => {
  let csdAccount: CharlesStanleyDirectAccount, jar: CookieJar, pass: string
  beforeAll(async () => {
    const user = properties.get('fund.charlesstanleydirect.user')
    pass = properties.get('fund.charlesstanleydirect.pass')
    const memorableWord = properties.get('fund.charlesstanleydirect.memorableWord')
        ;({ jar } = await new CharlesStanleyDirectAuth().login(user, pass, memorableWord))
    expect(jar).toBeTruthy()

    await db.init()
  })
  beforeEach(() => {
    csdAccount = new CharlesStanleyDirectAccount(jar, pass)
  })
  afterAll(async () => {
    await db.close()
  })
  test('getBalance should return account balance', async () => {
    const { portfolio, cash, totalValue, holdings } = await csdAccount.getBalance()
    expect(portfolio).not.toBeNegative().not.toBeNaN()
    expect(cash).toBeNumber().not.toBeNaN()
    expect(totalValue).toBePositive()
    expect(holdings).toBeArray()
  })
  test('getTransactions should return account transactions', async () => {
    const transactions = await csdAccount.getTransactions()
    expect(transactions).toBeArray().not.toBeEmpty()
    expect(transactions).toSatisfyAll(transaction => {
      const { date, sedol, contractReference, price, debit, credit, settlementDate, cash } = transaction
      return date instanceof Date &&
             (sedol.length === 7 || !sedol) &&
             (contractReference.length === 6 || !contractReference) &&
             (price >= 0 || isNaN(price)) &&
             (debit >= 0 || isNaN(debit)) &&
             (credit >= 0 || isNaN(credit)) &&
             (settlementDate instanceof Date || !settlementDate) &&
            _.isNumber(cash)
    })
  })
  test('getStatement should return account statement', async () => {
    const statement = await csdAccount.getStatement()
    expect(statement).toBeObject()
    expect(statement.series).toBeArray().not.toBeEmpty()
    expect(statement.events).toSatisfyAll((event : SeriesEvent) => {
      switch (event.type) {
        case 'fund': {
          const from = moment(event.from)
          const to = moment(event.to)
          return from.isValid() && to.isValid() && from.isSameOrBefore(to) &&
                    event.holdings.every(h => typeof h.sedol === 'string' && h.sedol && typeof h.weight === 'number')
        }
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
  test.skip('tradeFund', async () => {
    const action = new Sell('GB0006061963', '0606196', 0.001)
    const orderReference = await csdAccount.tradeFund(action)
    expect(orderReference).toBeString().toHaveLength(11)
  })
})
