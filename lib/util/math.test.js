const math = require('./math.js');

const Fund = require('../fund/Fund.js');

const _ = require('lodash');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

describe('math', function () {
    describe('pcToFloat', function () {
        it('should return float for valid input', function () {
            const valid = ['0%', '2.3%'];
            const expected = [0, 0.023];
            const actual = _.map(valid, math.pcToFloat);
            assert.deepEqual(actual, expected);
        });
        it('should return NaN for invalid input', function () {
            const invalid = [undefined, null, '--'];
            const expected = [NaN, NaN, NaN];
            const actual = _.map(invalid, math.pcToFloat);
            assert.deepEqual(actual, expected);
        });
    });

    describe('floatToPc', function () {
        it('should return percentage string for valid input', function () {
            const valid = [0, 0.023];
            const expected = ['0%', '2.3%'];
            const actual = _.map(valid, math.floatToPc);
            assert.deepEqual(actual, expected);
        });
        it('should return unchanged invalid input', function () {
            const invalid = [NaN, undefined, null, '--'];
            const expected = [NaN, undefined, null, '--'];
            const actual = _.map(invalid, math.floatToPc);
            assert.deepEqual(actual, expected);
        });
    });

    describe('computeAndAppendReturns', function () {
        const lookbacks = ['2W', '1W', '3D', '1D'];
        const returns = {
            '1M': 0.02
        };
        const historicPrices = [
            new Fund.HistoricPrice(new Date(2017, 3, 10), 486.0),
            new Fund.HistoricPrice(new Date(2017, 3, 11), 486.0),
            new Fund.HistoricPrice(new Date(2017, 3, 12), 482.0),
            new Fund.HistoricPrice(new Date(2017, 3, 13), 479.0),
            new Fund.HistoricPrice(new Date(2017, 3, 18), 475.0),
            new Fund.HistoricPrice(new Date(2017, 3, 19), 467.0),
            new Fund.HistoricPrice(new Date(2017, 3, 20), 468.0),
            new Fund.HistoricPrice(new Date(2017, 3, 21), 472.0),
            new Fund.HistoricPrice(new Date(2017, 3, 24), 469.0)
        ];
        it('should append correct returns', function () {
            const newReturns = math.computeAndAppendReturns(returns, historicPrices, lookbacks);
            expect(newReturns).to.contain.all.keys(returns);
            expect(newReturns).to.have.property('2W', (469 - 486) / 486);
            expect(newReturns).to.have.property('1W', (469 - 475) / 475);
            expect(newReturns).to.have.property('3D', (469 - 472) / 472);
            expect(newReturns).to.have.property('1D', (469 - 472) / 472);
        });
    });
});