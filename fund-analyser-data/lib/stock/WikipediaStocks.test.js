const WikipediaStocks = require('./WikipediaStocks')
const StreamTest = require('streamtest')

jest.setTimeout(30000) // 30 seconds

describe('WikipediaStocks', () => {
    let wikipediaStocks
    beforeEach(() => {
        wikipediaStocks = new WikipediaStocks()
    })
    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('Core methods', () => {
        test('getSymbols should return array of symbols', async () => {
            const symbols = await wikipediaStocks.getSymbols()
            expect(symbols).toIncludeAllMembers(['AAPL', 'GOOG'])
            expect(symbols.length).toBeGreaterThan(400)
        })
    })
})
