import * as math from './math'
import * as _ from 'lodash'

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

  describe('minIndex', () => {
    test('should return index of min element in array', () => {
      expect(math.minIndex([2, 3, -1, -4, 5])).toBe(3)
    })
    test('should return -1 for invalid input', () => {
      expect(math.minIndex(undefined)).toBe(-1)
      expect(math.minIndex(null)).toBe(-1)
      expect(math.minIndex('')).toBe(-1)
      expect(math.minIndex({})).toBe(-1)
      expect(math.minIndex(1)).toBe(-1)
    })
  })

  describe('roughEquals', () => {
    test('should throw error for invalid input', () => {
      expect(() => math.roughEquals('a', 'a')).toThrowError()
    })
    test('should return true if falls within percent tolerance', () => {
      expect(math.roughEquals(1, 1.01, 1)).toBeTrue()
      expect(math.roughEquals(1, 1.001, 0.1)).toBeTrue()
      expect(math.roughEquals(1, 1.001)).toBeTrue()
    })
    test('should return false if difference exceeds percent tolerance', () => {
      expect(math.roughEquals(1, 1.02, 1)).toBeFalse()
      expect(math.roughEquals(1, 1.002, 0.1)).toBeFalse()
      expect(math.roughEquals(1, 1.002)).toBeFalse()
    })
  })
})
