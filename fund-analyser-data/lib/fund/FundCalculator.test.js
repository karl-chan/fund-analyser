const FundCalculator = require('./FundCalculator')
const Fund = require('./Fund')

const _ = require('lodash')

const StreamTest = require('streamtest')

describe('FundCalculator', function () {
    let fundCalculator, fund
    const returns = {
        '1M': 0.02
    }
    const historicPrices = [
        new Fund.HistoricPrice(new Date(2017, 3, 10), 486.0),
        new Fund.HistoricPrice(new Date(2017, 3, 11), 486.0),
        new Fund.HistoricPrice(new Date(2017, 3, 12), 482.0),
        new Fund.HistoricPrice(new Date(2017, 3, 13), 479.0),
        new Fund.HistoricPrice(new Date(2017, 3, 18), 475.0),
        new Fund.HistoricPrice(new Date(2017, 3, 19), 467.0),
        new Fund.HistoricPrice(new Date(2017, 3, 20), 468.0),
        new Fund.HistoricPrice(new Date(2017, 3, 21), 472.0),
        new Fund.HistoricPrice(new Date(2017, 3, 24), 469.0)
    ]
    const indicators = {
        stability: -3
    }

    beforeEach(function () {
        fundCalculator = new FundCalculator()
        fund = Fund.Builder('GB00000ISIN0')
            .historicPrices(historicPrices)
            .returns(returns)
            .build()
    })

    test('evaluate should evaluate fund', function (done) {
        const newReturns = _.assign(returns, {
            '2W': 0.01,
            '1W': 0.005
        })
        const fundWithNewReturns = Fund.Builder('GB00000ISIN0')
            .historicPrices(historicPrices)
            .returns(newReturns)
            .build()
        const fundWithIndicators = Fund.Builder('GB00000ISIN0')
            .historicPrices(historicPrices)
            .returns(newReturns)
            .indicators(indicators)
            .build()
        const fundResult = Fund.Builder('GB00000ISIN0')
            .historicPrices(historicPrices)
            .returns(newReturns)
            .indicators(indicators)
            .build()

        jest.spyOn(fundCalculator, 'enrichReturns')
            .mockImplementation((f, callback) => {
                callback(null, fundWithNewReturns)
            })

        jest.spyOn(fundCalculator, 'calcIndicators')
            .mockImplementation((f, callback) => {
                expect(f).toEqual(fundWithIndicators)
                callback(null, fundWithIndicators)
            })

        fundCalculator.evaluate(fund, (err, actual) => {
            expect(actual).toEqual(fundResult)
            done(err)
        })
    })

    test('stream should return a Transform stream that evaluates fund', function (done) {
        const newReturns = _.assign(returns, {
            '2W': 0.01,
            '1W': 0.005
        })
        const expected = Fund.Builder('GB00000ISIN0')
            .historicPrices(historicPrices)
            .returns(newReturns)
            .build()

        const version = 'v2'

        jest.spyOn(fundCalculator, 'evaluate')
            .mockImplementation((f, callback) => {
                expect(f).toEqual(fund)
                callback(null, expected)
            })

        const fundStream = StreamTest[version].fromObjects([fund])
        fundStream
            .pipe(fundCalculator.stream())
            .pipe(StreamTest[version].toObjects((err, funds) => {
                expect(funds).toEqual([expected])
                done(err)
            }))
    })
})
