module.exports = {
    pcToFloat,
    floatToPc,
    minIndex,
    roughEquals
}

const _ = require('lodash')

function pcToFloat (pc) {
    return parseFloat(pc) / 100.0
};

function floatToPc (float) {
    return _.isFinite(float) ? `${float * 100}%` : float
}

function minIndex (arr) {
    if (!arr || !arr.length) {
        return -1
    }
    let minIndex = 0
    let min = arr[0]
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] < min) {
            minIndex = i
        }
    }
    return minIndex
}

function roughEquals (a, b, percentTolerance = 0.1) { // 0.1% tolerance by default
    if (typeof a !== 'number' || typeof b !== 'number' || typeof percentTolerance !== 'number') {
        throw new Error(`Expected all arguments to be numbers: [${a}] [${b}] [${percentTolerance}]!`)
    }
    const mid = (a + b) / 2
    const lowerBound = mid * (1 - percentTolerance / 200)
    const upperBound = mid * (1 + percentTolerance / 200)
    return lowerBound <= a && a <= upperBound && lowerBound <= b && b <= upperBound
}
