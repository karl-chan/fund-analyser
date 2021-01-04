import * as _ from 'lodash'
import * as lang from './lang'
const jstat = require('jstat')

// [w1, w2, ...] normalise such that w1' / w2' = w1 / w2 and w1' + w2' = 1
export function normaliseWeights (weights: any) {
  const s = _.sum(weights)
  return weights.map((w: any) => w / s)
}

// [[w1, x1], [w2, x2], ...]
export function weightedMean (arr: any) {
  if (_.isEmpty(arr)) {
    return NaN
  }
  // @ts-expect-error ts-migrate(7031) FIXME: Binding element 'w' implicitly has an 'any' type.
  const numerator = _.sum(arr.map(([w, x]) => w * x))
  // @ts-expect-error ts-migrate(7031) FIXME: Binding element 'w' implicitly has an 'any' type.
  const denominator = _.sum(arr.map(([w, _]) => w))
  return numerator / denominator
}

// [[w1, x1], [w2, x2], ...]
export function weightedVar (arr: any) {
  if (_.isEmpty(arr)) {
    return NaN
  }
  const [weights, xs] = _.unzip(arr)
  const normWeights = normaliseWeights(weights)
  const xsVar = jstat.variance(xs, true)
  return xsVar * _.sumBy(normWeights, (w: any) => w * w)
}

// [[w1, x1], [w2, x2], ...]
export function weightedStd (arr: any) {
  return _.isEmpty(arr) ? arr : Math.sqrt(weightedVar(arr))
}

export function ci95 (mean: any, stdev: any, n: any) {
  const z = 1.96
  return [mean - z * stdev, mean + z * stdev]
}

export function min (arr: any) {
  return jstat.min(arr.filter(lang.isOrdered))
}

export function max (arr: any) {
  return jstat.max(arr.filter(lang.isOrdered))
}

export function median (arr: any) {
  return jstat.median(arr.filter(lang.isOrdered))
}

export function q1 (arr: any) {
  return jstat.percentile(arr.filter(lang.isOrdered), 0.25)
}

export function q3 (arr: any) {
  return jstat.percentile(arr.filter(lang.isOrdered), 0.75)
}
