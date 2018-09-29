module.exports = {
    pcToFloat,
    floatToPc,
    minIndex
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
