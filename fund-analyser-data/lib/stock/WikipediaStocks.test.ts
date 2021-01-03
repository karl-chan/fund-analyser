import WikipediaStocks from './WikipediaStocks'

jest.setTimeout(30000) // 30 seconds

describe('WikipediaStocks', () => {
  let wikipediaStocks: any
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
