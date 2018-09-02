const math = require('./math.js')

const Fund = require('../fund/Fund.js')

const _ = require('lodash')

describe('math', () => {
    describe('pcToFloat', () => {
        test('should return float for valid input', () => {
            const valid = ['0%', '2.3%']
            const expected = [0, 0.023]
            const actual = _.map(valid, math.pcToFloat)
            expect(actual).toEqual(expected)
        })
        test('should return NaN for invalid input', () => {
            const invalid = [undefined, null, '--']
            const expected = [NaN, NaN, NaN]
            const actual = _.map(invalid, math.pcToFloat)
            expect(actual).toEqual(expected)
        })
    })

    describe('floatToPc', () => {
        test('should return percentage string for valid input', () => {
            const valid = [0, 0.023]
            const expected = ['0%', '2.3%']
            const actual = _.map(valid, math.floatToPc)
            expect(actual).toEqual(expected)
        })
        test('should return unchanged invalid input', () => {
            const invalid = [NaN, undefined, null, '--']
            const expected = [NaN, undefined, null, '--']
            const actual = _.map(invalid, math.floatToPc)
            expect(actual).toEqual(expected)
        })
    })

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
        test('should find closest records', () => {
            const boundary = new Fund.HistoricPrice(new Date(2017, 3, 10), 486.0)
            expect(math.closestRecord('5Y', historicPrices)).toEqual(boundary)
            expect(math.closestRecord('3Y', historicPrices)).toEqual(boundary)
            expect(math.closestRecord('1Y', historicPrices)).toEqual(boundary)
            expect(math.closestRecord('6M', historicPrices)).toEqual(boundary)
            expect(math.closestRecord('3M', historicPrices)).toEqual(boundary)
            expect(math.closestRecord('1M', historicPrices)).toEqual(boundary)
            expect(math.closestRecord('2W', historicPrices)).toEqual(boundary)
            expect(math.closestRecord('1W', historicPrices)).toEqual(
                new Fund.HistoricPrice(new Date(2017, 3, 18), 475.0))
            expect(math.closestRecord('3D', historicPrices)).toEqual(
                new Fund.HistoricPrice(new Date(2017, 3, 21), 472.0))
            expect(math.closestRecord('1D', historicPrices)).toEqual(
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
            const newReturns = math.enrichReturns(returns, historicPrices, additionalLookbacks)
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

    describe('calcPercentiles', () => {
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
        test('should calc correct percentiles', () => {
            const newReturns = math.calcPercentiles(returns, historicPrices, additionalLookbacks)
            const boundary = (469 - 467) / (486 - 467)
            expect(newReturns).toHaveProperty('5Y', boundary)
            expect(newReturns).toHaveProperty('3Y', boundary)
            expect(newReturns).toHaveProperty('1Y', boundary)
            expect(newReturns).toHaveProperty('6M', boundary)
            expect(newReturns).toHaveProperty('3M', boundary)
            expect(newReturns).toHaveProperty('1M', boundary)
            expect(newReturns).toHaveProperty('2W', boundary)
            expect(newReturns).toHaveProperty('1W', (469 - 467) / (475 - 467))
            expect(newReturns).toHaveProperty('3D', (469 - 469) / (472 - 469))
            expect(newReturns).toHaveProperty('1D', (469 - 469) / (472 - 469))
        })
    })

    describe('calcIndicators', () => {
        const historicPrices = [
            new Fund.HistoricPrice(new Date(2017, 3, 10), 486.0),
            new Fund.HistoricPrice(new Date(2017, 3, 11), 486.0),
            new Fund.HistoricPrice(new Date(2017, 3, 12), 482.0)
        ]
        test('should return a collection of indicators', () => {
            const indicators = math.calcIndicators(historicPrices)
            expect(indicators).toHaveProperty('stability')
            expect(indicators.stability).toBeNumber()
        })
    })
})
