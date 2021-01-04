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
    let res = await mainClient.isConnected()
    expect(res).toBeTrue()
    res = await (Promise as any).map(fundClients, (client: any) => client.isConnected())
    expect(res).toBeArray().not.toBeEmpty().toSatisfyAll((res: any) => res === true)
    res = await (Promise as any).map(stockClients, (client: any) => client.isConnected())
    expect(res).toBeArray().not.toBeEmpty().toSatisfyAll((res: any) => res === true)
  })
})
