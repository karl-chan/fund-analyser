import moment from 'moment'
import * as StreamTest from 'streamtest'
import NASDAQStocks from './NASDAQStocks'
import Stock from './Stock'

jest.setTimeout(30000) // 30 seconds

describe('NASDAQStocks', () => {
  let nasdaqStocks: NASDAQStocks
  beforeEach(() => {
    nasdaqStocks = new NASDAQStocks()
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
          lastUpdated: new Date(2017, 0, 1)
        },
        marketCap: 2_251_600_345_800
      }
      const historicPrices = [
        new Stock.HistoricPrice(new Date(2017, 0, 1), 457.0, 100000.0)
      ]
      const bidAskSpread = 0.01

      jest.spyOn(nasdaqStocks, 'getSummary')
        .mockImplementation(async () => summary)
      jest.spyOn(nasdaqStocks, 'getHistoricPrices')
        .mockImplementation(async () => historicPrices)
      jest.spyOn(nasdaqStocks, 'getBidAskSpread')
        .mockImplementation(async () => bidAskSpread)

      const expected = Stock.builder(symbol)
        .name(summary.name)
        .historicPrices(historicPrices)
        .asof(new Date(2017, 0, 1))
        .realTimeDetails(summary.realTimeDetails)
        .marketCap(2_251_600_345_800)
        .bidAskSpread(0.01)
        .build()

      const actual = await nasdaqStocks.getStockFromSymbol(symbol)
      expect(actual).toMatchObject(expected)
    })

    test('getStocksFromSymbols should return array of partial fund', async () => {
      const sedols = ['AAPL', 'GOOG']
      const stocks = [
        Stock.builder('AAPL').build(),
        Stock.builder('GOOG').build()
      ]

      jest.spyOn(nasdaqStocks, 'getStockFromSymbol')
        .mockImplementation(async sedol => {
          switch (sedol) {
            case 'AAPL':
              return stocks[0]

            case 'GOOG':
              return stocks[1]
          }
        })
      const actual = await nasdaqStocks.getStocksFromSymbols(sedols)
      expect(actual).toEqual(stocks)
    })

    test('getSummary should return summary object', async () => {
      const summary = await nasdaqStocks.getSummary('AAPL')
      expect(summary.name).toEqual('Apple Inc.')
      expect(summary.realTimeDetails).toMatchObject({
        estPrice: expect.toBeNumber(),
        estChange: expect.toBeNumber()
      })
      expect(summary.marketCap).toBeNumber()
    })

    test('getHistoricPrices should return historic prices object', async () => {
      const historicPrices = await nasdaqStocks.getHistoricPrices('AAPL')
      expect(historicPrices).toBeArray().not.toBeEmpty()
      expect(historicPrices).toSatisfyAll(hp => {
        return hp instanceof Stock.HistoricPrice &&
                        moment(hp.date).isValid() &&
                        hp.price !== 0 &&
                        typeof hp.volume === 'number' && !isNaN(hp.volume)
      })
    })

    test('getBidAskSpread should return bid-ask spread', async () => {
      const bidAskSpread = await nasdaqStocks.getBidAskSpread('AAPL')
      expect(bidAskSpread).toBePositive()
    })
  })

  describe('Stream methods', function () {
    const version = 'v2'
    test('streamStocksFromSymbols should return Transform stream outputting array of stocks', done => {
      const symbol1 = 'AAPL'
      const symbol2 = 'GOOG'
      const stock1 = Stock.builder(symbol1).build()
      const stock2 = Stock.builder(symbol2).build()

      jest.spyOn(nasdaqStocks, 'getStockFromSymbol')
        .mockImplementation(async (symbol: string) => {
          switch (symbol) {
            case symbol1:
              return stock1
            case symbol2:
              return stock2
          }
        })

      const symbolToFundStream = nasdaqStocks.streamStocksFromSymbols()
      StreamTest[version].fromObjects([symbol1, symbol2])
        .pipe(symbolToFundStream)
        .pipe(StreamTest[version].toObjects((err, funds) => {
          expect(funds).toEqual([stock1, stock2])
          done(err)
        }))
    })
  })
})
