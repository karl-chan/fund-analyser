import { Promise } from 'bluebird'
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
    const { mainClient, fundClients, stockClients } = db.get()
    const res = await mainClient.isConnected()
    expect(res).toBeTrue()
    const fundRes = await Promise.map(fundClients, client => client.isConnected())
    expect(fundRes).toBeArray().not.toBeEmpty().toSatisfyAll((res: any) => res === true)
    const stockRes = await Promise.map(stockClients, client => client.isConnected())
    expect(stockRes).toBeArray().not.toBeEmpty().toSatisfyAll((res: any) => res === true)
  })
})
