module.exports = {
    deepKeys,
    deepKeysSatisfying,
    deepMap,
    deepTraverse,
    pairsToDeepObject,
    isOrdered,
    parseNumber
}

const _ = require('lodash')

function deepKeys (object) {
    return deepKeysSatisfying(object, x => x)
}

function deepKeysSatisfying (object, predicate) {
    const res = deepTraverse(object, (ks, v, acc) => {
        if (predicate(ks, v)) {
            return [v, acc.concat(ks.join('.'))]
        }
        return [v, acc]
    }, [])
    return res[1]
}

function deepMap (object, mapper) {
    const res = deepTraverse(object, (ks, v, acc) => {
        return [mapper(v), acc]
    })
    return res[0]
}

/**
 * Traverse the supplied object recursively with function f. f should return each new value and accumulated result. Returns the final object and accumulated result. Note that the original object is untouched.
 * @param {*} object
 * @param {*} f Should accept (ks, v, acc) = (array of keys, old value, accumulator) and return [v', acc'] = (new value, new accumulator)
 * @param {*} initialAcc initial accumulator value. Defaults to empty list.
 */
function deepTraverse (object, f, initialAcc = []) {
    const traverse = (ks, v, f, acc) => {
        const isTerminalNode = !_.isObjectLike(v) || _.isEmpty(v)
        if (isTerminalNode) {
            return ks.length ? f(ks, v, acc) : [v, acc]
        }
        if (Array.isArray(v)) {
            // case array
            let arr = v
            for (let [i, v] of arr.entries()) {
                const kss = ks.concat([i])
                const [v2, acc2] = traverse(kss, v, f, acc)
                if (v !== v2) {
                    const arr2 = arr.slice()
                    arr2[i] = v2
                    arr = arr2
                }
                acc = acc2
            }
            v = arr
        } else {
            // case object
            let o = v
            for (const [k, v] of Object.entries(o)) {
                const kss = ks.concat([k])
                const [v2, acc2] = traverse(kss, v, f, acc)
                if (v !== v2) {
                    const o2 = Object.assign({}, o)
                    o2[k] = v2
                    o = o2
                }
                acc = acc2
            }
            v = o
        }
        return [v, acc]
    }
    return traverse([], object, f, initialAcc)
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

function parseNumber (str) {
    if (typeof str === 'number') {
        return str
    }
    if (typeof str !== 'string') {
        return NaN
    }
    return parseFloat(str.replace(/[, ]/g, ''))
}
