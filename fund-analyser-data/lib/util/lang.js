module.exports = {
    deepKeys,
    deepKeysSatisfying,
    pairsToDeepObject,
    isOrdered
}

const _ = require('lodash')

function deepKeys (object) {
    return deepKeysSatisfying(object, x => x)
}

function deepKeysSatisfying (object, predicate) {
    if (!_.isObjectLike(object) || Array.isArray(object)) {
        return []
    }
    return _.flatMap(Object.entries(object), ([k, v]) => {
        const innerKeys = deepKeysSatisfying(v, predicate)
        if (innerKeys.length) {
            return innerKeys.map(innerKey => `${k}.${innerKey}`)
        } else {
            return predicate(k, v) ? [k] : []
        }
    })
}

function pairsToDeepObject (pairs) {
    if (!Array.isArray(pairs)) {
        return {}
    }
    const object = {}
    for (let [k, v] of pairs) {
        _.set(object, k, v)
    }
    return object
}

function isOrdered (value) {
    if (typeof value === 'number') {
        return _.isFinite(value)
    }
    if (value instanceof Date) {
        return true
    }
    return false
}
