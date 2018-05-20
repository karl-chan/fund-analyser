const csv = require('./csv.js')

const _ = require('lodash')

describe('csv', () => {
    it('formatFields should return json2csv fields', () => {
        const fields = ['isin', 'returns.5Y']
        const expected = ['ISIN', 'returns.5Y']
        const actual = _.map(csv.formatFields(fields), f => f.label)
        expect(actual).toEqual(expected)
    })
})
