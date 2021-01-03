import * as fundCache from './fundCache'
import * as db from '../../lib/util/db'

jest.setTimeout(60000) // 60 seconds

describe('fundCache', () => {
  beforeAll(async () => {
    await db.init()
  })
  afterAll(async () => {
    await db.close()
  })
  describe('before cache is populated', () => {
    test('cache should throw error on access', () => {
      expect(fundCache.get).toThrowError()
    })
  })

  describe.each([true, false])('after cache is populated from clean boot: %s', (clean: any) => {
    beforeAll(async () => {
      await fundCache.start(clean)
    })
    afterAll(async () => {
      fundCache.shutdown()
    })
    test('cache should be loaded after a short moment', () => {
      const funds = fundCache.get()
      expect(funds).toBeArray()
      expect(funds.length).toBeGreaterThan(3000)
    })
    test('cache should perform isin match', () => {
      const isin = 'GB0006061963'
      const funds = fundCache.get([isin])
      expect(funds).toBeArrayOfSize(1)
      expect(funds[0]).toHaveProperty('isin', isin)
    })
    test('cache filter should perform substring match', () => {
      const filterText = 'Baillie Gifford American Fund B'
      const funds = fundCache.get(undefined, { filterText })
      expect(funds)
        .not.toBeEmpty()
        .toSatisfyAll((f: any) => f.name.includes(filterText) ||
            f.holdings.some((h: any) => h.name.includes(filterText))
        )
    })

    test('getMetadata should return metadata object', () => {
      const metadata = fundCache.getMetadata()
      expect(metadata.asof.date).toBeValidDate()
      expect(metadata.asof.numUpToDate).toBePositive()
      expect(metadata.stats).toBeObject()
      expect(metadata.totalFunds).toBePositive()
    })
  })
})
