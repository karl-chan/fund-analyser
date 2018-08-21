const indicators = require('./indicators.js')
const Fund = require('../fund/Fund.js')

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
        it('should return nan for invalid or too few input', () => {
            expect(indicators.calcMacd(null)).toBeNaN()
            expect(indicators.calcMacd([])).toBeNaN()
            expect(indicators.calcMacd(historicPrices.slice(0, 33))).toBeNaN()
        })
        it('should return correct MACD', () => {
            expect(indicators.calcMacd(historicPrices)).toBeCloseTo(1.69)
        })
    })

    describe('calcStability', () => {
        it('should return nan for invalid input', () => {
            expect(indicators.calcStability(null)).toBeNaN()
            expect(indicators.calcStability([])).toBeNaN()
            expect(indicators.calcStability([
                new Fund.HistoricPrice(new Date(2017, 3, 10), 486.0) // requires at least two datapoints
            ])).toBeNaN()
        })
        it('should calculate correct stability', () => {
            const stability = indicators.calcStability(historicPrices)
            expect(stability).toBeCloseTo(0.59)
        })
    })
})
