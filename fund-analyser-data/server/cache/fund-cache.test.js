const fundCache = require('./fund-cache')
const db = require('../../lib/util/db')
const moment = require('moment')

const TIMEOUT = moment.duration(10, 'minutes')

describe('fund-cache', () => {
    jest.setTimeout(TIMEOUT.asMilliseconds())
    beforeAll(async () => {
        await db.init()
        await fundCache.start()
    })
    afterAll(async () => {
        await db.close()
        fundCache.shutdown()
    })
    test('cache should be empty initially', () => {
        const funds = fundCache.get()
        expect(funds).toEqual([])
    })
    test('cache should be loaded after a short moment', (done) => {
        const wait = moment.duration(5, 'seconds')
        setTimeout(() => {
            const funds = fundCache.get()
            expect(funds).toBeArray()
            expect(funds.length).toBeGreaterThan(3000)
            done()
        }, wait)
    })
})
