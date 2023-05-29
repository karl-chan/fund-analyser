import * as _ from 'lodash'
import * as StreamTest from 'streamtest'
import Stock from '../stock/Stock'
import * as db from '../util/db'
import * as StockDAO from './StockDAO'

jest.setTimeout(30000) // 30 seconds

describe('StockDAO', function () {
  let stock: Stock, doc: object
  beforeAll(async () => {
    await db.init()
    await StockDAO.deleteStocks({ query: { symbol: /test/ } })
  })
  afterAll(async () => {
    await StockDAO.deleteStocks({ query: { symbol: /test/ } })
    await db.close()
  })
  beforeEach(function () {
    stock = Stock.builder('test')
      .name('Test stock')
      .historicPrices([new Stock.HistoricPrice(new Date(2017, 3, 23), 457.0, 100000.0)])
      .returns({ '5Y': 0.5, '3Y': -0.2, '1Y': 0.3, '6M': 0.4, '3M': 0, '1M': -0.2 })
      .indicators({
        stability: { value: -3 }
      })
      .realTimeDetails({ estChange: 0.01, estPrice: 457.0, bidAskSpread: 0.01, longestTimeGap: 5, lastUpdated: new Date(2017, 3, 23) })
      .fundamentals({
        marketCap: 1_000_000,
        yld: 0.00661
      })
      .build()
    doc = {
      _id: 'test',
      symbol: 'test',
      name: 'Test stock',
      historicPrices: [{
        date: new Date(2017, 3, 23),
        price: 457.0,
        volume: 100000.0
      }],
      returns: { '5Y': 0.5, '3Y': -0.2, '1Y': 0.3, '6M': 0.4, '3M': 0, '1M': -0.2 },
      asof: undefined,
      indicators: {
        stability: { value: -3 }
      },
      realTimeDetails: { estChange: 0.01, estPrice: 457.0, bidAskSpread: 0.01, longestTimeGap: 5, lastUpdated: new Date(2017, 3, 23) },
      fundamentals: {
        marketCap: 1_000_000,
        yld: 0.00661
      }
    }
  })
  test('fromStock should return plain object', function () {
    const actual = StockDAO.fromStock(stock)
    expect(_.isPlainObject(actual)).toBeTrue()
    expect(actual).toEqual(doc)
  })
  test('toStock should return Stock object', function () {
    const actual = StockDAO.toStock(doc)
    expect(actual).toBeInstanceOf(Stock)
    expect(actual).toEqual(stock)
  })

  test('listStocks', async () => {
    await StockDAO.upsertStocks([stock])
    const stocks = await StockDAO.listStocks({ query: { symbol: stock.symbol } })
    expect(stocks).toBeArrayOfSize(1)
    expect(stocks[0]).toEqual(stock)

    const symbols = await StockDAO.listStocks({ query: { symbol: stock.symbol }, projection: { _id: 0, symbol: 1 } }, true)
    expect(symbols).toBeArrayOfSize(1)
    expect(symbols[0]).toContainAllKeys(['symbol']) // only 'symbol' and not other keys
  })
  test('streamStocks', async () => {
    const version = 'v2'
    await StockDAO.upsertStocks([stock])

    const actual: Stock[] =
      await new Promise((resolve, reject) =>
        StockDAO.streamStocks({ query: { symbol: stock.symbol } })
          .pipe(StreamTest[version].toObjects((err, actual: Stock[]) => {
            err ? reject(err) : resolve(actual)
          })))
    expect(actual).toBeArrayOfSize(1)
    expect(actual[0]).toEqual(stock)
  })
  test('upsertStocks', async () => {
    // insert stock
    await StockDAO.upsertStocks([stock])
    let stocks = await StockDAO.listStocks({ query: { symbol: stock.symbol } })
    expect(stocks).toBeArrayOfSize(1)
    expect(stocks[0]).toEqual(stock)

    // modify stock and upsert again
    stock = stock
      .toBuilder()
      .name('Modified name')
      .build()
    await StockDAO.upsertStocks([stock])
    stocks = await StockDAO.listStocks({ query: { symbol: stock.symbol } })
    expect(stocks).toBeArrayOfSize(1)
    expect(stocks[0]).toHaveProperty('name', 'Modified name')
  })
  test('deleteStocks', async () => {
    await StockDAO.upsertStocks([stock])
    let stocks = await StockDAO.listStocks({ query: { symbol: stock.symbol } })
    expect(stocks).toBeArrayOfSize(1)

    await StockDAO.deleteStocks({ query: { symbol: 'bad symbol' } })
    stocks = await StockDAO.listStocks({ query: { symbol: stock.symbol } })
    expect(stocks).toBeArrayOfSize(1)

    await StockDAO.deleteStocks({ query: { symbol: stock.symbol } })
    stocks = await StockDAO.listStocks({ query: { symbol: stock.symbol } })
    expect(stocks).toBeArrayOfSize(0)
  })
  test('search should return relevant results', async () => {
    await StockDAO.upsertStocks([stock])
    const stocks = await StockDAO.search('test', { symbol: 1 }, 1)
    expect(stocks).toBeArrayOfSize(1)
    expect(stocks[0].symbol).toBe(stock.symbol)
    expect(stocks[0].score).toBePositive()
  })
})
