const csv = require('./csv.js');

const _ = require('lodash');
const chai = require('chai');
const assert = chai.assert;

describe('csv', function () {
    it('formatFields should return json2csv fields', function () {
        const fields = ['isin', 'returns.5Y'];
        const expected = ['ISIN', '5Y'];
        const actual =_.map(csv.formatFields(fields), f => f.label)
        assert.deepEqual(actual, expected);
    });
});