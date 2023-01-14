import * as _ from 'lodash'
import * as lang from './lang'
const jstat = require('jstat')

// [w1, w2, ...] normalise such that w1' / w2' = w1 / w2 and w1' + w2' = 1
export function normaliseWeights (weights: number[]): number[] {
  const s = _.sum(weights)
  return weights.map(w => w / s)
}

// [[w1, x1], [w2, x2], ...]
export function weightedMean (arr: [number, number][]): number {
  if (_.isEmpty(arr)) {
    return NaN
  }
  const numerator = _.sum(arr.map(([w, x]) => w * x))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const denominator = _.sum(arr.map(([w, _]) => w))
  return numerator / denominator
}

// [[w1, x1], [w2, x2], ...]
export function weightedVar (arr: [number, number][]): number {
  if (_.isEmpty(arr)) {
    return NaN
  }
  const [weights, xs] = _.unzip(arr)
  const normWeights = normaliseWeights(weights)
  const xsVar = jstat.variance(xs, true)
  return xsVar * _.sumBy(normWeights, w => w * w)
}

// [[w1, x1], [w2, x2], ...]
export function weightedStd (arr: [number, number][]): number {
  return _.isEmpty(arr) ? NaN : Math.sqrt(weightedVar(arr))
}

export function ci95 (mean: number, stdev: number): [number, number] {
  const z = 1.96
  return [mean - z * stdev, mean + z * stdev]
}

export function min (arr: number[]): number {
  return jstat.min(arr.filter(lang.isOrdered))
}

export function max (arr: number[]): number {
  return jstat.max(arr.filter(lang.isOrdered))
}

export function median (arr: number[]): number {
  return jstat.median(arr.filter(lang.isOrdered))
}

export function q1 (arr: number[]): number {
  return jstat.percentile(arr.filter(lang.isOrdered), 0.25)
}

export function q3 (arr: number[]): number {
  return jstat.percentile(arr.filter(lang.isOrdered), 0.75)
}
