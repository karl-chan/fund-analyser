module.exports = {
    weightedMean,
    weightedVar,
    weightedStd,
    ci95,
    min,
    max,
    median
}

const _ = require('lodash')
const jStat = require('jStat')

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
    const xsVar = jStat.variance(xs, true)
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
    return jStat.min(arr.filter(isOrdered))
}

function max (arr) {
    return jStat.max(arr.filter(isOrdered))
}

function median (arr) {
    return jStat.median(arr.filter(isOrdered))
}

function isOrdered (v) {
    if (typeof v === 'number') {
        return _.isFinite(v)
    }
    if (v instanceof Date) {
        return true
    }
    return false
}
