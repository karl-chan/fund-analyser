
import * as StreamTest from 'streamtest'
import NYSEStocks from './NYSEStocks'

jest.setTimeout(30000) // 30 seconds

describe('NYSEStocks', () => {
  let nyseStocks: any
  beforeEach(() => {
    nyseStocks = new NYSEStocks()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Core methods', () => {
    test('getSymbols should return symbols', async () => {
      const actual = await nyseStocks.getSymbols()
      expect(actual).toIncludeAllMembers(['AAPL', 'GOOG'])
    })
  })

  describe('Stream methods', function () {
    const version = 'v2'
    test('streamSymbols should return Readable stream outputting array of symbols', (done: any) => {
      const symbolStream = nyseStocks.streamSymbols()
      symbolStream
        .pipe(StreamTest[version].toObjects((err: any, symbols: any) => {
          expect(symbols).toIncludeAllMembers(['AAPL', 'GOOG'])
          done(err)
        }))
    })
  })
})
