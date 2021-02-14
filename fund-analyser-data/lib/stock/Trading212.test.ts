
import * as StreamTest from 'streamtest'
import Trading212 from './Trading212'

jest.setTimeout(30000) // 30 seconds

describe('Trading212', () => {
  let trading212: Trading212
  beforeEach(() => {
    trading212 = new Trading212()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Core methods', () => {
    test('getSymbols should return symbols', async () => {
      const actual = await trading212.getSymbols()
      expect(actual).toIncludeAllMembers(['AAPL', 'GOOG'])
    })
  })

  describe('Stream methods', function () {
    const version = 'v2'
    test('streamSymbols should return Readable stream outputting array of symbols', done => {
      const symbolStream = trading212.streamSymbols()
      symbolStream
        .pipe(StreamTest[version].toObjects((err, symbols) => {
          expect(symbols).toIncludeAllMembers(['AAPL', 'GOOG'])
          done(err)
        }))
    })
  })
})
