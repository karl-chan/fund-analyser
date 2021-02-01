import * as stat from './stat'

describe('stat', () => {
  describe('weightedMean', () => {
    test('should give weighted mean for 2d array', () => {
      const input: [number, number][] = [[0.1, 10], [0.2, 20]]
      const expected = (0.1 * 10 + 0.2 * 20) / (0.1 + 0.2)
      const actual = stat.weightedMean(input)
      expect(actual).toEqual(expected)
    })
  })
})
