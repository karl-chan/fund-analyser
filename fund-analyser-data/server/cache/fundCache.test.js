const fundCache = require('./fundCache')
const db = require('../../lib/util/db')

jest.setTimeout(30000) // 30 seconds

describe('fundCache', () => {
    beforeAll(async () => {
        await db.init()
    })
    afterAll(async () => {
        await db.close()
        fundCache.shutdown()
    })
    describe('before cache is populated', () => {
        test('cache should throw error on access', () => {
            expect(fundCache.get).toThrowError()
        })
    })

    describe('after cache is populated', () => {
        beforeAll(async () => {
            await fundCache.start()
        })
        test('cache should be loaded after a short moment', () => {
            const funds = fundCache.get()
            expect(funds).toBeArray()
            expect(funds.length).toBeGreaterThan(3000)
        })
        test('cache filter should perform substring match', () => {
            const filterText = 'Baillie Gifford American Fund B'
            const funds = fundCache.get(undefined, {filterText})
            expect(funds)
                .not.toBeEmpty()
                .toSatisfyAll(f => f.name.includes(filterText))
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
