const Stock = require('./Stock')

describe('Stock', function () {
    let symbol, name, historicPrices, returns, asof, indicators, realTimeDetails
    let stock

    beforeEach(() => {
        symbol = 'AAPL'
        name = 'Apple Inc'
        historicPrices = [
            new Stock.HistoricPrice(new Date(2015, 8, 9), 3.198, 3.198, 3.199, 3.197, 3.198, 100000.0),
            new Stock.HistoricPrice(new Date(2015, 8, 10), 3.148, 3.149, 3.150, 3.147, 3.148, 100000.0)
        ]
        returns = { '5Y': 0.1767, '3Y': 0.226 }
        asof = new Date(2018, 8, 8)
        indicators = { stability: 1.96 }
        realTimeDetails = { estChange: -0.00123 }

        stock = new Stock(symbol, name, historicPrices, returns, asof, indicators, realTimeDetails)
    })
    test('constructor should populate Stock with correct fields', () => {
        expect(stock).toMatchObject({ symbol, name, historicPrices, returns, asof, indicators, realTimeDetails })
    })

    test('isValid should return true for stock with name', () => {
        expect(stock.isValid()).toBeTrue()
    })
    test('isValid should return false for stock without name', () => {
        const undefinedNameStock = new Stock(symbol, undefined)
        const nullNameStock = new Stock(symbol, null)
        const emptyNameStock = new Stock(symbol, '')
        expect([undefinedNameStock, nullNameStock, emptyNameStock]).toSatisfyAll(f => !f.isValid())
    })

    describe('Builder', () => {
        test('build should bulid Stock object', () => {
            const builder = Stock.Builder(symbol)
                .name(name)
                .historicPrices(historicPrices)
                .returns(returns)
                .asof(asof)
                .indicators(indicators)
                .realTimeDetails(realTimeDetails)
            const actual = builder.build()
            expect(actual).toBeInstanceOf(Stock)
            expect(actual).toEqual(stock)
        })
    })
})
