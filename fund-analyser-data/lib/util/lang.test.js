const lang = require('./lang')

const _ = require('lodash')

describe('lang', () => {
    describe('deepKeys', () => {
        test('should return empty array for non-objects', () => {
            for (let object of [null, undefined, 1, 's', [], ['a', 'b']]) {
                expect(lang.deepKeys(object)).toEqual([])
            }
        })

        test('should return keys for object', () => {
            expect(lang.deepKeys({'a': 1, 'b': 2, '+c': 3, 4: 5})).toEqual(['4', 'a', 'b', '+c'])
        })

        test('should return deep keys for object', () => {
            expect(lang.deepKeys({
                'a': 1,
                'b': {'c': 2, 'd': {'e': 3}},
                'f': {},
                'g': [5, 6],
                'h': [{'i': 7}],
                8: '9'
            })).toEqual(['8', 'a', 'b.c', 'b.d.e', 'f', 'g', 'h'])
        })
    })

    describe('deepKeysSatisfying', () => {
        test('should return empty array for non-objects', () => {
            for (let object of [null, undefined, 1, 's', [], ['a', 'b']]) {
                expect(lang.deepKeysSatisfying(object)).toEqual([])
            }
        })

        test('should return keys for object satisfying predicate', () => {
            const predicate = (k, v) => v !== 3
            expect(lang.deepKeysSatisfying({'a': 1, 'b': 2, '+c': 3, 4: 5}, predicate)).toEqual(['4', 'a', 'b'])
        })

        test('should return deep keys for object satisfying predicate', () => {
            const predicate = (k, v) => _.isNumber(v)
            expect(lang.deepKeysSatisfying({
                'a': 1,
                'b': {'c': 2, 'd': {'e': 3}},
                'f': {},
                'g': [5, 6],
                'h': [{'i': 7}],
                8: '9'
            }, predicate)).toEqual(['a', 'b.c', 'b.d.e'])
        })
    })

    describe('pairsToDeepObject', () => {
        test('should handle base case', () => {
            expect(lang.pairsToDeepObject(null)).toEqual({})
            expect(lang.pairsToDeepObject(undefined)).toEqual({})

            expect(lang.pairsToDeepObject(123)).toEqual({})

            expect(lang.pairsToDeepObject('string')).toEqual({})

            expect(lang.pairsToDeepObject({this: 'is not array'})).toEqual({})
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
})
