import * as db from './db'
jest.setTimeout(30000) // 30 seconds
describe('db', () => {
  beforeAll(async () => {
    await db.init()
  })
  afterAll(async () => {
    await db.close()
  })
  test('connectivity test', async () => {
    const { mainDb, fundDbs, stockDbs } = db.get()
    expect(mainDb).not.toBeUndefined()
    expect(fundDbs).toBeArray().not.toBeEmpty().toSatisfyAll(fundDb => fundDb !== undefined)
    expect(stockDbs).toBeArray().not.toBeEmpty().toSatisfyAll(stockDb => stockDb !== undefined)
  })
})
