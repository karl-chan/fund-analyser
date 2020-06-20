const StockCalculator = require('./StockCalculator')
const Stock = require('./Stock')

const _ = require('lodash')

const StreamTest = require('streamtest')

describe('StockCalculator', function () {
    let stockCalculator, stock
    const returns = {
        '1M': 0.02
    }
    const historicPrices = [
        new Stock.HistoricPrice(new Date(2017, 3, 10), 486.0, 486.0, 486.0, 486.0, 100000.0),
        new Stock.HistoricPrice(new Date(2017, 3, 11), 486.0, 486.0, 486.0, 486.0, 100000.0),
        new Stock.HistoricPrice(new Date(2017, 3, 12), 482.0, 482.0, 482.0, 482.0, 100000.0),
        new Stock.HistoricPrice(new Date(2017, 3, 13), 479.0, 479.0, 479.0, 479.0, 100000.0),
        new Stock.HistoricPrice(new Date(2017, 3, 18), 475.0, 475.0, 475.0, 475.0, 100000.0),
        new Stock.HistoricPrice(new Date(2017, 3, 19), 467.0, 467.0, 467.0, 467.0, 100000.0),
        new Stock.HistoricPrice(new Date(2017, 3, 20), 468.0, 468.0, 468.0, 468.0, 100000.0),
        new Stock.HistoricPrice(new Date(2017, 3, 21), 472.0, 472.0, 472.0, 472.0, 100000.0),
        new Stock.HistoricPrice(new Date(2017, 3, 24), 469.0, 469.0, 469.0, 469.0, 100000.0)
    ]
    const indicators = {
        stability: -3
    }

    beforeEach(function () {
        stockCalculator = new StockCalculator()
        stock = Stock.Builder('aapl')
            .historicPrices(historicPrices)
            .returns(returns)
            .build()
    })

    test('evaluate should evaluate stock', async () => {
        const newReturns = _.assign(returns, {
            '2W': 0.01,
            '1W': 0.005
        })
        const stockWithNewReturns = Stock.Builder('aapl')
            .historicPrices(historicPrices)
            .returns(newReturns)
            .build()
        const stockWithIndicators = Stock.Builder('aapl')
            .historicPrices(historicPrices)
            .returns(newReturns)
            .indicators(indicators)
            .build()
        const stockResult = Stock.Builder('aapl')
            .historicPrices(historicPrices)
            .returns(newReturns)
            .indicators(indicators)
            .build()

        jest.spyOn(stockCalculator, 'calcReturns')
            .mockImplementation(async f => stockWithNewReturns)

        jest.spyOn(stockCalculator, 'calcIndicators')
            .mockImplementation(async f => {
                expect(f).toEqual(stockWithNewReturns)
                return stockWithIndicators
            })

        const actual = await stockCalculator.evaluate(stock)
        expect(actual).toEqual(stockResult)
    })

    test('stream should return a Transform stream that evaluates stock', done => {
        const newReturns = _.assign(returns, {
            '2W': 0.01,
            '1W': 0.005
        })
        const expected = Stock.Builder('aapl')
            .historicPrices(historicPrices)
            .returns(newReturns)
            .build()

        const version = 'v2'

        jest.spyOn(stockCalculator, 'evaluate')
            .mockImplementation(async f => {
                expect(f).toEqual(stock)
                return expected
            })

        const stockStream = StreamTest[version].fromObjects([stock])
        stockStream
            .pipe(stockCalculator.stream())
            .pipe(StreamTest[version].toObjects((err, stocks) => {
                expect(stocks).toEqual([expected])
                done(err)
            }))
    })
})
