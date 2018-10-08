const fundUtils = require('./fundUtils')

const Fund = require('../fund/Fund')

describe('fundUtils', () => {
    describe('closestRecord', () => {
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
        test('should return null for invalid input', () => {
            expect(fundUtils.closestRecord('5Y', undefined)).toBeNull()
            expect(fundUtils.closestRecord('5Y', [])).toBeNull()
        })
        test('should find closest records', () => {
            const boundary = new Fund.HistoricPrice(new Date(2017, 3, 10), 486.0)
            expect(fundUtils.closestRecord('5Y', historicPrices)).toBeNull()
            expect(fundUtils.closestRecord('3Y', historicPrices)).toBeNull()
            expect(fundUtils.closestRecord('1Y', historicPrices)).toBeNull()
            expect(fundUtils.closestRecord('6M', historicPrices)).toBeNull()
            expect(fundUtils.closestRecord('3M', historicPrices)).toBeNull()
            expect(fundUtils.closestRecord('1M', historicPrices)).toBeNull()
            expect(fundUtils.closestRecord('2W', historicPrices)).toEqual(boundary)
            expect(fundUtils.closestRecord('1W', historicPrices)).toEqual(
                new Fund.HistoricPrice(new Date(2017, 3, 18), 475.0))
            expect(fundUtils.closestRecord('3D', historicPrices)).toEqual(
                new Fund.HistoricPrice(new Date(2017, 3, 21), 472.0))
            expect(fundUtils.closestRecord('1D', historicPrices)).toEqual(
                new Fund.HistoricPrice(new Date(2017, 3, 21), 472.0))
        })
    })

    describe('enrichReturns', () => {
        const additionalLookbacks = ['2W', '1W', '3D', '1D']
        const returns = { '5Y': 0.5, '3Y': -0.2, '1Y': 0.3, '6M': 0.4, '3M': 0, '1M': -0.2 }
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
        test('should append correct returns', () => {
            const newReturns = fundUtils.enrichReturns(returns, historicPrices, additionalLookbacks)
            expect(newReturns).toContainKeys(Object.keys(returns))
            expect(newReturns).toHaveProperty('5Y', 0.5)
            expect(newReturns).toHaveProperty('3Y', -0.2)
            expect(newReturns).toHaveProperty('1Y', 0.3)
            expect(newReturns).toHaveProperty('6M', 0.4)
            expect(newReturns).toHaveProperty('3M', 0)
            expect(newReturns).toHaveProperty('1M', -0.2)
            expect(newReturns).toHaveProperty('2W', (469 - 486) / 486)
            expect(newReturns).toHaveProperty('1W', (469 - 475) / 475)
            expect(newReturns).toHaveProperty('3D', (469 - 472) / 472)
            expect(newReturns).toHaveProperty('1D', (469 - 472) / 472)
        })
    })

    describe('calcStats', () => {
        const funds = [
            Fund.Builder('Fund1')
                .ocf(0.07)
                .entryCharge(0.02)
                .returns({'5Y': 0.3})
                .indicators({stability: 1})
                .asof(new Date(2001, 0, 1))
                .build(),
            Fund.Builder('Fund2')
                .amc(0.04)
                .entryCharge(0.02)
                .returns({'5Y': 0.1})
                .indicators({stability: 2})
                .asof(new Date(2001, 0, 2))
                .build()
        ]
        test('should calc correct stats', () => {
            const {max, min, median} = fundUtils.calcStats(funds)
            expect(max).not.toHaveProperty('isin')
            expect(max).toMatchObject({'ocf': 0.07, 'amc': 0.04, 'entryCharge': 0.02, 'exitCharge': undefined, 'returns': {'5Y': 0.3}, 'indicators': {'stability': 2}, 'asof': new Date(2001, 0, 2)})
            expect(min).toMatchObject({'ocf': 0.07, 'amc': 0.04, 'entryCharge': 0.02, 'exitCharge': undefined, 'returns': {'5Y': 0.1}, 'indicators': {'stability': 1}, 'asof': new Date(2001, 0, 1)})
            expect(median).toMatchObject({'ocf': 0.07, 'amc': 0.04, 'entryCharge': 0.02, 'exitCharge': NaN, 'returns': {'5Y': 0.2}, 'indicators': {'stability': 1.5}, 'asof': NaN})
        })
    })

    describe('calcIndicators', () => {
        const historicPrices = [
            new Fund.HistoricPrice(new Date(2017, 3, 10), 486.0),
            new Fund.HistoricPrice(new Date(2017, 3, 11), 486.0),
            new Fund.HistoricPrice(new Date(2017, 3, 12), 482.0)
        ]
        test('should return a collection of indicators', () => {
            const indicators = fundUtils.calcIndicators(historicPrices)
            expect(indicators).toHaveProperty('stability')
            expect(indicators.stability).toBeNumber()
        })
    })
})
