import * as db from '../../lib/util/db'
import * as stockCache from './stockCache'

jest.setTimeout(60000) // 60 seconds

describe('stockCache', () => {
  beforeAll(async () => {
    await db.init()
  })
  afterAll(async () => {
    await db.close()
  })
  describe('before cache is populated', () => {
    test('cache should throw error on access', () => {
      expect(stockCache.get).toThrowError()
    })
  })

  describe.each([true, false])('after cache is populated from clean boot: %s', (clean: any) => {
    beforeAll(async () => {
      await stockCache.start(clean)
    })
    afterAll(async () => {
      stockCache.shutdown()
    })
    test('cache should be loaded after a short moment', () => {
      const stocks = stockCache.get()
      expect(stocks).toBeArray()
      expect(stocks.length).toBeGreaterThan(400)
    })
    test('cache should perform symbol match', () => {
      const symbol = 'AAPL'
      const stocks = stockCache.get([symbol])
      expect(stocks).toBeArrayOfSize(1)
      expect(stocks[0]).toHaveProperty('symbol', symbol)
    })
    test('cache filter should perform substring match', () => {
      const filterText = 'Apple'
      const stocks = stockCache.get(undefined, { filterText })
      expect(stocks)
        .not.toBeEmpty()
        .toSatisfyAll((f: any) => f.name.toLowerCase().includes(filterText.toLowerCase()))
    })

    test('getMetadata should return metadata object', () => {
      const metadata = stockCache.getMetadata()
      expect(metadata.asof.date).toBeValidDate()
      expect(metadata.asof.numUpToDate).toBePositive()
      expect(metadata.stats).toBeObject()
      expect(metadata.totalStocks).toBePositive()
    })
  })
})
