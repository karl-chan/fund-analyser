import * as db from '../util/db'
import TokenDAO from './TokenDAO'

jest.setTimeout(30000) // 30 seconds

describe('TokenDAO', function () {
  beforeAll(async () => {
    await db.init()
  })
  afterAll(async () => {
    await db.close()
  })

  test('getFreeRealTimeToken', async function () {
    const token = await TokenDAO.getFreeRealTimeToken()
    expect(token.expiry).toBeAfter(new Date())
  })
})
