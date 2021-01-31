import * as _ from 'lodash'

export function deepKeys (object: any) {
  return deepKeysSatisfying(object, (x: any) => x)
}

/**
 * Returns keys (as . separated strings) matching predicate.
 * @param {*} object
 * @param {*} predicate (ks, value) => boolean. ks is array of path to current value.
 */
export function deepKeysSatisfying (object: any, predicate: any) {
  const res = deepTraverse(object, (ks: any, v: any, acc: any) => {
    if (predicate(ks, v)) {
      return [v, acc.concat(ks.join('.'))]
    }
    return [v, acc]
  }, [])
  return res[1]
}

export function deepMap (object: any, mapper: any) {
  const res = deepTraverse(object, (ks: any, v: any, acc: any) => {
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
export function deepTraverse (object: any, f: any, initialAcc : any[] = []) {
  const traverse = (ks: any, v: any, f: any, acc: any) => {
    const isTerminalNode = !_.isObjectLike(v) || _.isEmpty(v)
    if (isTerminalNode) {
      return ks.length ? f(ks, v, acc) : [v, acc]
    }
    if (Array.isArray(v)) {
      // case array
      let arr = v
      for (const [i, v] of arr.entries()) {
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

export function pairsToDeepObject (pairs: any[]) {
  if (!pairs) {
    return {}
  }
  const object = {}
  for (const [k, v] of pairs) {
    _.set(object, k, v)
  }
  return object
}

/**
 * Like Object.assign(...), but skips undefined keys in sources
 * @param {*} object
 * @param  {...any} sources
 */
export function assignIfDefined (dest: any, ...sources: any[]) {
  for (const source of sources) {
    if (source && typeof source === 'object') {
      for (const [k, v] of Object.entries(source)) {
        if (k !== undefined && v !== undefined) {
          dest[k] = v
        }
      }
    }
  }
  return dest
}

/** Returns set difference of two arrays. */
export function setDifference (arr1: any, arr2: any) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
    return undefined
  }
  const s2 = new Set(arr2)
  return arr1.filter(e1 => !s2.has(e1))
}

export function isOrdered (value: any) {
  if (typeof value === 'number') {
    return _.isFinite(value)
  }
  if (value instanceof Date) {
    return true
  }
  return false
}

export function parseNumber (str: any) {
  if (typeof str === 'number') {
    return str
  }
  if (typeof str !== 'string') {
    return NaN
  }
  return parseFloat(str.replace(/[, ]/g, ''))
}
