const lang = require('./lang')

const _ = require('lodash')

describe('lang', () => {
    describe('deepKeys', () => {
        test('should return empty array for non-objects / non-arrays', () => {
            for (let object of [null, undefined, 1, 's']) {
                expect(lang.deepKeys(object)).toEqual([])
            }
        })

        test('should return keys for object', () => {
            expect(lang.deepKeys({ 'a': 1, 'b': 2, '+c': 3, 4: 5 })).toEqual(['4', 'a', 'b', '+c'])
        })

        test('should return deep keys for object', () => {
            expect(lang.deepKeys({
                'a': 1,
                'b': { 'c': 2, 'd': { 'e': 3 } },
                'f': {},
                8: '9'
            })).toEqual(['8', 'a', 'b.c', 'b.d.e', 'f'])
        })

        test('should return keys for arrays', () => {
            expect(lang.deepKeys([1, 2, 3, 4])).toEqual(['0', '1', '2', '3'])
        })

        test('should return deep keys for deep arrays', () => {
            expect(lang.deepKeys({
                'a': [{ 'b': 1 }, { 'c': 2, 'd': 3 }],
                'e': [[{ 'f': 4, 'g': [5, { 'h': 6 }] }]]
            })).toEqual(['a.0.b', 'a.1.c', 'a.1.d', 'e.0.0.f', 'e.0.0.g.0', 'e.0.0.g.1.h'])
        })
    })

    describe('deepKeysSatisfying', () => {
        test('should return empty array for non-objects  / non-arrays', () => {
            for (let object of [null, undefined, 1, 's']) {
                expect(lang.deepKeysSatisfying(object, v => true)).toEqual([])
            }
        })

        test('should return keys for object satisfying predicate', () => {
            const predicate = (k, v) => v !== 3
            expect(lang.deepKeysSatisfying({ 'a': 1, 'b': 2, '+c': 3, 4: 5 }, predicate)).toEqual(['4', 'a', 'b'])
        })

        test('should return deep keys for object satisfying predicate', () => {
            const predicate = (k, v) => _.isNumber(v)
            expect(lang.deepKeysSatisfying({
                'a': 1,
                'b': { 'c': 2, 'd': { 'e': 3 } },
                'f': {},
                8: '9'
            }, predicate)).toEqual(['a', 'b.c', 'b.d.e'])
        })

        test('should return keys for arrays satisfying predicate', () => {
            const predicate = (k, v) => v !== 3
            expect(lang.deepKeysSatisfying([1, 2, 3, 4], predicate)).toEqual(['0', '1', '3'])
        })

        test('should return deep keys for deep arrays satisfying predicate', () => {
            const predicate = (k, v) => v === 3 || v === 6
            expect(lang.deepKeysSatisfying({
                'a': [{ 'b': 1 }, { 'c': 2, 'd': 3 }],
                'e': [[{ 'f': 4, 'g': [5, { 'h': 6 }] }]]
            }, predicate)).toEqual(['a.1.d', 'e.0.0.g.1.h'])
        })
    })

    describe('deepMap', () => {
        test('should return as-is for non-objects / non-arrays', () => {
            for (let object of [null, undefined, 1, 's']) {
                expect(lang.deepMap(object, v => true)).toEqual(object)
            }
        })

        test('should return transformed object with values mapped', () => {
            const mapper = v => v + 1
            expect(lang.deepMap({ 'a': 1, 'b': 2, '+c': 3, 4: 5 }, mapper)).toEqual({ 'a': 2, 'b': 3, '+c': 4, 4: 6 })
        })

        test('should return transformed object with deep values mapped', () => {
            const mapper = v => typeof v === 'number' ? v + 1 : v
            expect(lang.deepMap({
                'a': 1,
                'b': { 'c': 2, 'd': { 'e': 3 } },
                'f': {},
                8: '9'
            }, mapper)).toEqual({
                'a': 2,
                'b': { 'c': 3, 'd': { 'e': 4 } },
                'f': {},
                8: '9'
            })
        })

        test('should return transformed array with values mapped', () => {
            const mapper = v => typeof v === 'number' ? v + 1 : v
            expect(lang.deepMap([0, 1, 2, 3], mapper)).toEqual([1, 2, 3, 4])
        })

        test('should return transformed object with deep values mapped', () => {
            const mapper = v => typeof v === 'number' ? v + 1 : v
            expect(lang.deepMap({
                'a': [{ 'b': 1 }, { 'c': 2, 'd': 3 }],
                'e': [[{ 'f': 4, 'g': [5, { 'h': 6 }] }]],
                'i': '7'
            }, mapper)).toEqual({
                'a': [{ 'b': 2 }, { 'c': 3, 'd': 4 }],
                'e': [[{ 'f': 5, 'g': [6, { 'h': 7 }] }]],
                'i': '7' })
        })
    })

    describe('pairsToDeepObject', () => {
        test('should handle base case', () => {
            expect(lang.pairsToDeepObject(null)).toEqual({})
            expect(lang.pairsToDeepObject(undefined)).toEqual({})

            expect(lang.pairsToDeepObject(123)).toEqual({})

            expect(lang.pairsToDeepObject('string')).toEqual({})

            expect(lang.pairsToDeepObject({ this: 'is not array' })).toEqual({})
            expect(lang.pairsToDeepObject([])).toEqual({})
        })
        test('should form shallow object', () => {
            expect(lang.pairsToDeepObject([['a', 2], ['b', 3]])).toEqual({
                a: 2,
                b: 3
            })
        })
        test('should form deep object', () => {
            expect(lang.pairsToDeepObject([['a', 2], ['b.c', 3], ['b.d.e', 4], ['b.e', 5]])).toEqual({
                a: 2,
                b: {
                    c: 3,
                    d: { e: 4 },
                    e: 5
                }
            })
        })
    })
    describe('assignIfDefined', () => {
        test('should handle base case', () => {
            expect(lang.assignIfDefined(null)).toEqual(null)
            expect(lang.assignIfDefined(2, 3, null)).toEqual(2)
        })
        test('should assign only defined keys', () => {
            expect(lang.assignIfDefined(
                {},
                { a: undefined, b: 2, c: 3 },
                { a: 1, b: undefined, c: 4 })
            ).toEqual({ a: 1, b: 2, c: 4 })
        })
    })
    describe('parseNumber', () => {
        test('should pass through numbers', () => {
            expect(lang.parseNumber(-1.23)).toBe(-1.23)
            expect(lang.parseNumber(-NaN)).toBeNaN()
        })
        test('should parse valid strings', () => {
            expect(lang.parseNumber('-1,234,567.89')).toBe(-1234567.89)
            expect(lang.parseNumber('-1 234 567.89')).toBe(-1234567.89)
            expect(lang.parseNumber('-1.23 cr')).toBe(-1.23)
            expect(lang.parseNumber('1.23 dr')).toBe(1.23)
        })
        test('should return NaN for invalid input', () => {
            expect(lang.parseNumber('NaN')).toBeNaN()
            expect(lang.parseNumber('-NaN')).toBeNaN()
            expect(lang.parseNumber('string')).toBeNaN()
            expect(lang.parseNumber('{}')).toBeNaN()
            expect(lang.parseNumber('[]')).toBeNaN()
            expect(lang.parseNumber({})).toBeNaN()
            expect(lang.parseNumber([])).toBeNaN()
        })
    })
})
