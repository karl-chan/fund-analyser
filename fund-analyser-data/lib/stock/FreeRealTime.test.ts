import moment from 'moment'
import * as StreamTest from 'streamtest'
import * as db from '../util/db'
import FreeRealTime from './FreeRealTime'
import Stock from './Stock'

jest.setTimeout(30000) // 30 seconds

describe('FreeRealTime', () => {
  let freeRealTime: FreeRealTime
  beforeAll(async () => {
    await db.init()
  })
  afterAll(async () => {
    await db.close()
  })
  beforeEach(() => {
    freeRealTime = new FreeRealTime()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Core methods', () => {
    test('getStockFromSymbol should return stock', async () => {
      const symbol = 'AAPL'
      const summary = {
        name: 'APPLE',
        realTimeDetails: {
          estPrice: 351.7,
          estChange: 0.0003,
          bidAskSpread: 0.01,
          longestTimeGap: 5,
          lastUpdated: new Date(2017, 0, 1)
        },
        fundamentals: {
          marketCap: 2_251_600_345_800,
          beta: 1.1844589710235596,
          eps: 6.03,
          pbRatio: 35.086,
          peRatio: 25.7,
          psRatio: 7.091,
          yld: 0.00661
        }
      }
      const historicPrices = [
        new Stock.HistoricPrice(new Date(2017, 0, 1), 457.0, 100000.0)
      ]

      jest.spyOn(freeRealTime, 'getSummary')
        .mockImplementation(async () => summary)
      jest.spyOn(freeRealTime, 'getHistoricPrices')
        .mockImplementation(async () => historicPrices)

      const expected = Stock.builder(symbol)
        .name(summary.name)
        .historicPrices(historicPrices)
        .asof(new Date(2017, 0, 1))
        .realTimeDetails(summary.realTimeDetails)
        .fundamentals({
          marketCap: 2_251_600_345_800,
          yld: 0.00661
        })
        .build()

      const actual = await freeRealTime.getStockFromSymbol(symbol)
      expect(actual).toMatchObject(expected)
    })

    test('getStocksFromSymbols should return array of partial fund', async () => {
      const sedols = ['AAPL', 'GOOG']
      const stocks = [
        Stock.builder('AAPL').build(),
        Stock.builder('GOOG').build()
      ]

      jest.spyOn(freeRealTime, 'getStockFromSymbol')
        .mockImplementation(async sedol => {
          switch (sedol) {
            case 'AAPL':
              return stocks[0]

            case 'GOOG':
              return stocks[1]
          }
        })
      const actual = await freeRealTime.getStocksFromSymbols(sedols)
      expect(actual).toEqual(stocks)
    })

    test('getSummary should return summary object', async () => {
      const summary = await freeRealTime.getSummary('AAPL')
      expect(summary.name).toEqual('Apple Inc.')
      expect(summary.realTimeDetails).toMatchObject({
        estPrice: expect.toBeNumber(),
        estChange: expect.toBeNumber(),
        bidAskSpread: expect.toBePositive(),
        // apple is highly liquid stock, expect a trade every few seconds
        longestTimeGap: expect.toBeWithin(0, 60)
      })
      expect(summary.fundamentals).toMatchObject({
        marketCap: expect.toBePositive(),
        beta: expect.toBePositive(),
        eps: expect.toBePositive(),
        pbRatio: expect.toBePositive(),
        peRatio: expect.toBePositive(),
        psRatio: expect.toBePositive(),
        yld: expect.toBeWithin(0, 1)
      })
    })

    test('getHistoricPrices should return historic prices object', async () => {
      const historicPrices = await freeRealTime.getHistoricPrices('AEP')
      expect(historicPrices).toBeArray().not.toBeEmpty()
      expect(historicPrices).toSatisfyAll(hp => {
        return hp instanceof Stock.HistoricPrice &&
                        moment(hp.date).isValid() &&
                        hp.price !== 0 &&
                        typeof hp.volume === 'number' && !isNaN(hp.volume)
      })
    })
  })

  describe('Stream methods', function () {
    const version = 'v2'
    test('streamStocksFromSymbols should return Transform stream outputting array of stocks', done => {
      const symbol1 = 'AAPL'
      const symbol2 = 'GOOG'
      const stock1 = Stock.builder(symbol1).build()
      const stock2 = Stock.builder(symbol2).build()

      jest.spyOn(freeRealTime, 'getStockFromSymbol')
        .mockImplementation(async (symbol: string) => {
          switch (symbol) {
            case symbol1:
              return stock1
            case symbol2:
              return stock2
          }
        })

      const symbolToFundStream = freeRealTime.streamStocksFromSymbols()
      StreamTest[version].fromObjects([symbol1, symbol2])
        .pipe(symbolToFundStream)
        .pipe(StreamTest[version].toObjects((err, funds) => {
          expect(funds).toEqual([stock1, stock2])
          done(err)
        }))
    })
  })

  describe.skip('Headless methods', () => {
    test('fetchToken should return unexpired token', async () => {
      const token = await freeRealTime.fetchToken()
      expect(moment(token.expiry).isAfter()).toBeTrue()
    })
  })
})
