module.exports = {
    weightedMean,
    weightedVar,
    weightedStd,
    ci95,
    min,
    max,
    median,
    q1,
    q3
}

const _ = require('lodash')
const jstat = require('jstat')
const lang = require('./lang')

// [w1, w2, ...] normalise such that w1' / w2' = w1 / w2 and w1' + w2' = 1
function normaliseWeights (weights) {
    const s = _.sum(weights)
    return weights.map(w => w / s)
}

// [[w1, x1], [w2, x2], ...]
function weightedMean (arr) {
    if (_.isEmpty(arr)) {
        return NaN
    }
    const numerator = _.sum(arr.map(([w, x]) => w * x))
    const denominator = _.sum(arr.map(([w, _]) => w))
    return numerator / denominator
}

// [[w1, x1], [w2, x2], ...]
function weightedVar (arr) {
    if (_.isEmpty(arr)) {
        return NaN
    }
    const [weights, xs] = _.unzip(arr)
    const normWeights = normaliseWeights(weights)
    const xsVar = jstat.variance(xs, true)
    return xsVar * _.sumBy(normWeights, w => w * w)
}

// [[w1, x1], [w2, x2], ...]
function weightedStd (arr) {
    return _.isEmpty(arr) ? arr : Math.sqrt(weightedVar(arr))
}

function ci95 (mean, stdev, n) {
    const z = 1.96
    return [mean - z * stdev, mean + z * stdev]
}

function min (arr) {
    return jstat.min(arr.filter(lang.isOrdered))
}

function max (arr) {
    return jstat.max(arr.filter(lang.isOrdered))
}

function median (arr) {
    return jstat.median(arr.filter(lang.isOrdered))
}

function q1 (arr) {
    return jstat.percentile(arr.filter(lang.isOrdered), 0.25)
}

function q3 (arr) {
    return jstat.percentile(arr.filter(lang.isOrdered), 0.75)
}
