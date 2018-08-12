const indicators = require('./indicators.js')
const Fund = require('../fund/Fund.js')

describe('indicators', () => {
    describe('calcStability', () => {
        it('should calculate correct stability', () => {
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
            const stability = indicators.calcStability(historicPrices)
            expect(stability).toBe(0.625)
        })
    })
})
