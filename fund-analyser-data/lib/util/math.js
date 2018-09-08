module.exports = {
    pcToFloat,
    floatToPc
}

const _ = require('lodash')

function pcToFloat (pc) {
    return parseFloat(pc) / 100.0
};

function floatToPc (float) {
    return _.isFinite(float) ? `${float * 100}%` : float
}
