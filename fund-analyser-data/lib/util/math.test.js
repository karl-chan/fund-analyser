const math = require('./math')
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
})
