const NYTimes = require('./NYTimes')

jest.setTimeout(30000) // 30 seconds

describe('NYTimes', function () {
    let nyTimes
    beforeEach(function () {
        nyTimes = new NYTimes()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    test('getExchangeTickers', async () => {
        const tickers = await nyTimes.getExchangeTickers()
        expect(tickers).toEqual(['ASX', 'PAR', 'FRA', 'HKG', 'LSE', 'MEX', 'MIL', 'NSQ', 'NSI', 'NYQ', 'SGO', 'SAO', 'SHH', 'TYO', 'TOR'])
    })

    test('getHolidaysForExchange', async () => {
        const exchange = 'TYO'
        const holidays = await nyTimes.getHolidaysForExchange(exchange)
        expect(holidays).toBeArray().not.toBeEmpty()

        const januaryFirst = new Date(new Date().getFullYear(), 0, 1)
        expect(holidays[0]).toEqual(januaryFirst)
    })
})
