const indicators = require('./indicators')
const Fund = require('../fund/Fund')

describe('indicators', () => {
    let historicPrices
    beforeEach(() => {
        historicPrices = [
            new Fund.HistoricPrice(new Date(2017, 3, 10), 486.0),
            new Fund.HistoricPrice(new Date(2017, 3, 11), 486.0),
            new Fund.HistoricPrice(new Date(2017, 3, 12), 482.0),
            new Fund.HistoricPrice(new Date(2017, 3, 13), 479.0),
            new Fund.HistoricPrice(new Date(2017, 3, 18), 475.0),
            new Fund.HistoricPrice(new Date(2017, 3, 19), 467.0),
            new Fund.HistoricPrice(new Date(2017, 3, 20), 468.0),
            new Fund.HistoricPrice(new Date(2017, 3, 21), 472.0),
            new Fund.HistoricPrice(new Date(2017, 3, 24), 469.0),
            new Fund.HistoricPrice(new Date(2017, 3, 25), 474.0),
            new Fund.HistoricPrice(new Date(2017, 3, 26), 477.0),
            new Fund.HistoricPrice(new Date(2017, 3, 27), 474.0),
            new Fund.HistoricPrice(new Date(2017, 3, 28), 473.0),
            new Fund.HistoricPrice(new Date(2017, 4, 2), 473.0),
            new Fund.HistoricPrice(new Date(2017, 4, 3), 474.0),
            new Fund.HistoricPrice(new Date(2017, 4, 4), 475.0),
            new Fund.HistoricPrice(new Date(2017, 4, 5), 473.0),
            new Fund.HistoricPrice(new Date(2017, 4, 8), 474.0),
            new Fund.HistoricPrice(new Date(2017, 4, 9), 475.0),
            new Fund.HistoricPrice(new Date(2017, 4, 10), 474.0),
            new Fund.HistoricPrice(new Date(2017, 4, 11), 476.0),
            new Fund.HistoricPrice(new Date(2017, 4, 12), 477.0),
            new Fund.HistoricPrice(new Date(2017, 4, 15), 474.0),
            new Fund.HistoricPrice(new Date(2017, 4, 16), 478.0),
            new Fund.HistoricPrice(new Date(2017, 4, 17), 474.0),
            new Fund.HistoricPrice(new Date(2017, 4, 18), 464.0),
            new Fund.HistoricPrice(new Date(2017, 4, 19), 467.0),
            new Fund.HistoricPrice(new Date(2017, 4, 22), 470.0),
            new Fund.HistoricPrice(new Date(2017, 4, 23), 473.0),
            new Fund.HistoricPrice(new Date(2017, 4, 24), 475.0),
            new Fund.HistoricPrice(new Date(2017, 4, 25), 476.0),
            new Fund.HistoricPrice(new Date(2017, 4, 26), 482.0),
            new Fund.HistoricPrice(new Date(2017, 4, 30), 482.0),
            new Fund.HistoricPrice(new Date(2017, 4, 31), 482.0),
            new Fund.HistoricPrice(new Date(2017, 5, 1), 482.0)
        ]
    })

    describe('calcMacd', () => {
        test('should return nan for invalid or too few input', () => {
            expect(indicators.calcMacd(null)).toBeNaN()
            expect(indicators.calcMacd([])).toBeNaN()
            expect(indicators.calcMacd(historicPrices.slice(0, 33))).toBeNaN()
        })
        test('should return correct MACD', () => {
            expect(indicators.calcMacd(historicPrices)).toBeCloseTo(1.69)
        })
    })

    describe('calcMdd', () => {
        test('should return nan for invalid input', () => {
            expect(indicators.calcMdd(null)).toBeNaN()
            expect(indicators.calcMdd([])).toBeNaN()
        })
        test('should return correct MDD', () => {
            expect(indicators.calcMdd(historicPrices)).toBeCloseTo(0.04)
        })
    })

    describe('calcReturns', () => {
        test('should return nulls if exceeds range', () => {
            expect(indicators.calcReturns([])).toEqual({
                '5Y': { max: null, min: null },
                '3Y': { max: null, min: null },
                '1Y': { max: null, min: null },
                '6M': { max: null, min: null },
                '3M': { max: null, min: null },
                '1M': { max: null, min: null },
                '2W': { max: null, min: null },
                '1W': { max: null, min: null },
                '3D': { max: null, min: null },
                '1D': { max: null, min: null }
            })
        })
        test('should calculate correct results', () => {
            const actual = indicators.calcReturns(historicPrices)
            expect(actual['5Y']['max']).toBeNull()
            expect(actual['5Y']['min']).toBeNull()
            expect(actual['3Y']['max']).toBeNull()
            expect(actual['3Y']['min']).toBeNull()
            expect(actual['1Y']['max']).toBeNull()
            expect(actual['1Y']['min']).toBeNull()
            expect(actual['6M']['max']).toBeNull()
            expect(actual['6M']['min']).toBeNull()
            expect(actual['3M']['max']).toBeNull()
            expect(actual['3M']['min']).toBeNull()
            expect(actual['1M']['max']).toBeCloseTo(0.02)
            expect(actual['1M']['min']).toBeCloseTo(-0.02)
            expect(actual['2W']['max']).toBeCloseTo(0.04)
            expect(actual['2W']['min']).toBeCloseTo(-0.02)
            expect(actual['1W']['max']).toBeCloseTo(0.03)
            expect(actual['1W']['min']).toBeCloseTo(-0.04)
            expect(actual['3D']['max']).toBeCloseTo(0.02)
            expect(actual['3D']['min']).toBeCloseTo(-0.03)
            expect(actual['1D']['max']).toBeCloseTo(0.01)
            expect(actual['1D']['min']).toBeCloseTo(-0.02)
        })
    })

    describe('calcStability', () => {
        test('should return nan for invalid input', () => {
            expect(indicators.calcStability(null)).toBeNaN()
            expect(indicators.calcStability([])).toBeNaN()
            expect(indicators.calcStability([
                new Fund.HistoricPrice(new Date(2017, 3, 10), 486.0) // requires at least two datapoints
            ])).toBeNaN()
        })
        test('should calculate correct stability', () => {
            const stability = indicators.calcStability(historicPrices)
            expect(stability).toBe(2.5)
        })
    })

    describe('calcIndicators', () => {
        test('should return combined indicators', () => {
            const actual = indicators.calcIndicators(historicPrices)
            expect(actual).toBeObject()
                .toContainAllKeys(['stability', 'macd', 'mdd', 'returns'])
            expect(actual.stability).toBeFinite()
            expect(actual.macd).toBeFinite()
            expect(actual.mdd).toBeFinite()
            expect(actual.returns).toBeObject()
        })
    })
})
