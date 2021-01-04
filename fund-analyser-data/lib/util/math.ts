import * as _ from 'lodash'

export function pcToFloat (pc: any) {
  return parseFloat(pc) / 100.0
};

export function floatToPc (float: any) {
  return _.isFinite(float) ? `${float * 100}%` : float
}

export function minIndex (arr: any) {
  if (!arr || !arr.length) {
    return -1
  }
  let minIndex = 0
  const min = arr[0]
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) {
      minIndex = i
    }
  }
  return minIndex
}

export function roughEquals (a: any, b: any, percentTolerance = 0.1) { // 0.1% tolerance by default
  if (typeof a !== 'number' || typeof b !== 'number' || typeof percentTolerance !== 'number') {
    throw new Error(`Expected all arguments to be numbers: [${a}] [${b}] [${percentTolerance}]!`)
  }
  const mid = (a + b) / 2
  const lowerBound = mid * (1 - percentTolerance / 200)
  const upperBound = mid * (1 + percentTolerance / 200)
  return lowerBound <= a && a <= upperBound && lowerBound <= b && b <= upperBound
}
