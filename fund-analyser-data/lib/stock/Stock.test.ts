import Stock from './Stock'

describe('Stock', function () {
  let symbol: string, name: string, historicPrices: Stock.HistoricPrice[], returns: Stock.Returns, asof: Date, indicators: Stock.Indicators, realTimeDetails: Stock.RealTimeDetails, fundamentals: object
  let stock: Stock

  beforeEach(() => {
    symbol = 'AAPL'
    name = 'Apple Inc'
    historicPrices = [
      new Stock.HistoricPrice(new Date(2015, 8, 9), 3.198, 100000.0),
      new Stock.HistoricPrice(new Date(2015, 8, 10), 3.148, 100000.0)
    ]
    returns = { '5Y': 0.1767, '3Y': 0.226 }
    asof = new Date(2018, 8, 8)
    indicators = { stability: { value: 1.96 } }
    realTimeDetails = {
      estChange: -0.00123,
      estPrice: 3.198,
      bidAskSpread: 0.01,
      longestTimeGap: 5,
      lastUpdated: undefined
    }
    fundamentals = {
      marketCap: 22_000_000_000,
      yld: 0.00661
    }

    stock = new Stock(symbol, name, historicPrices, returns, asof, indicators, realTimeDetails, fundamentals)
  })
  test('constructor should populate Stock with correct fields', () => {
    expect(stock).toMatchObject({ symbol, name, historicPrices, returns, asof, indicators, realTimeDetails })
  })

  test('isValid should return true for stock with name', () => {
    expect(stock.isValid()).toBeTrue()
  })
  test('isValid should return false for stock without name', () => {
    const undefinedNameStock = new Stock(symbol, undefined, [], {}, undefined, undefined, undefined, undefined)
    const nullNameStock = new Stock(symbol, null, [], {}, undefined, undefined, undefined, undefined)
    const emptyNameStock = new Stock(symbol, '', [], {}, undefined, undefined, undefined, undefined)
    expect([undefinedNameStock, nullNameStock, emptyNameStock]).toSatisfyAll(f => !f.isValid())
  })

  describe('Builder', () => {
    test('build should bulid Stock object', () => {
      const builder = Stock.builder(symbol)
        .name(name)
        .historicPrices(historicPrices)
        .returns(returns)
        .asof(asof)
        .indicators(indicators)
        .realTimeDetails(realTimeDetails)
        .fundamentals(fundamentals)
      const actual = builder.build()
      expect(actual).toBeInstanceOf(Stock)
      expect(actual).toEqual(stock)
    })
  })
})
