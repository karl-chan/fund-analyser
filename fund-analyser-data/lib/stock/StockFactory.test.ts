import * as StreamTest from 'streamtest'
import * as streamWrapper from '../util/streamWrapper'
import Stock from './Stock'
import StockFactory from './StockFactory'

describe('StockFactory', function () {
  let stockFactory: StockFactory

  beforeEach(function () {
    stockFactory = new StockFactory()
  })

  test('getStocks should return array of stocks', async () => {
    const expected = [
      Stock.builder('AAPL').build(),
      Stock.builder('GOOG').build()
    ]

    jest.spyOn(stockFactory.symbolProvider, 'getSymbols')
      .mockImplementation(async () => ['AAPL', 'GOOG'])
    jest.spyOn(stockFactory.stockProvider, 'getStocksFromSymbols')
      .mockImplementation(async symbols => {
        expect(symbols).toEqual(['AAPL', 'GOOG'])
        return expected
      })
    jest.spyOn(stockFactory.stockCalculator, 'evaluate')
      .mockImplementation(async stock => stock)

    const actual = await stockFactory.getStocks()
    expect(actual).toEqual(expected)
  })

  test('streamStocks should return a Transform stream outputting array of funds', done => {
    const symbol1 = 'AAPL'
    const symbol2 = 'GOOG'
    const stock1 = Stock.builder(symbol1).build()
    const stock2 = Stock.builder(symbol2).build()

    const version = 'v2'
    const symbolStream = StreamTest[version].fromObjects([symbol1, symbol2])
    const symbolToStockStream = streamWrapper.asTransformAsync(async (symbol: string) => {
      switch (symbol) {
        case symbol1: return stock1
        case symbol2: return stock2
        default: throw new Error(`Unrecognised symbol: ${symbol}`)
      }
    })
    const stockCalculationStream = streamWrapper.asTransformAsync(async (stock: Stock) => stock)

    jest.spyOn(stockFactory.symbolProvider, 'streamSymbols')
      .mockReturnValue(symbolStream)
    jest.spyOn(stockFactory.stockProvider, 'streamStocksFromSymbols')
      .mockReturnValue(symbolToStockStream)
    jest.spyOn(stockFactory.stockCalculator, 'stream')
      .mockReturnValue(stockCalculationStream)

    stockFactory.streamStocks()
      .pipe(StreamTest[version].toObjects((err, funds) => {
        expect(funds).toEqual([stock1, stock2])
        done(err)
      }))
  })

  test('streamStocksFromSymbols should return a Transform stream outputting array of funds', done => {
    const symbol1 = 'AAPL'
    const symbol2 = 'GOOG'
    const stock1 = Stock.builder(symbol1).build()
    const stock2 = Stock.builder(symbol2).build()

    const version = 'v2'
    const symbolToStockStream = streamWrapper.asTransformAsync(async (symbol: string) => {
      switch (symbol) {
        case symbol1: return stock1
        case symbol2: return stock2
        default: throw new Error(`Unrecognised stock: ${symbol}`)
      }
    })
    const stockCalculationStream = streamWrapper.asTransformAsync(async (stock: Stock) => stock)

    jest.spyOn(stockFactory.stockProvider, 'streamStocksFromSymbols')
      .mockReturnValue(symbolToStockStream)
    jest.spyOn(stockFactory.stockCalculator, 'stream')
      .mockReturnValue(stockCalculationStream)

    stockFactory.streamStocksFromSymbols([symbol1, symbol2])
      .pipe(StreamTest[version].toObjects((err, stocks) => {
        expect(stocks).toEqual([stock1, stock2])
        done(err)
      }))
  })
})
