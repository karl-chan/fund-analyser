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

    describe('closestRecord', function () {
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
        it('should find closest records', function () {
            const boundary = new Fund.HistoricPrice(new Date(2017, 3, 10), 486.0);
            assert.isTrue(
                _.isEqual(math.closestRecord('5Y', historicPrices), boundary));
            assert.isTrue(
                _.isEqual(math.closestRecord('3Y', historicPrices), boundary));
            assert.isTrue(
                _.isEqual(math.closestRecord('1Y', historicPrices), boundary));
            assert.isTrue(
                _.isEqual(math.closestRecord('6M', historicPrices), boundary));
            assert.isTrue(
                _.isEqual(math.closestRecord('3M', historicPrices), boundary));
            assert.isTrue(
                _.isEqual(math.closestRecord('1M', historicPrices), boundary));
            assert.isTrue(
                _.isEqual(math.closestRecord('2W', historicPrices), boundary));
            assert.isTrue(
                _.isEqual(math.closestRecord('1W', historicPrices),
                    new Fund.HistoricPrice(new Date(2017, 3, 18), 475.0)));
            assert.isTrue(
                _.isEqual(math.closestRecord('3D', historicPrices),
                    new Fund.HistoricPrice(new Date(2017, 3, 21), 472.0)));
            assert.isTrue(
                _.isEqual(math.closestRecord('1D', historicPrices),
                    new Fund.HistoricPrice(new Date(2017, 3, 21), 472.0)));
        });
    });

    describe('enrichReturns', function () {
        const additionalLookbacks = ['2W', '1W', '3D', '1D'];
        const returns = {'5Y': 0.5, '3Y': -0.2, '1Y': 0.3, '6M': 0.4, '3M': 0, '1M': -0.2};
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
            const newReturns = math.enrichReturns(returns, historicPrices, additionalLookbacks);
            expect(newReturns).to.contain.all.keys(returns);
            expect(newReturns).to.have.property('5Y', 0.5);
            expect(newReturns).to.have.property('3Y', -0.2);
            expect(newReturns).to.have.property('1Y', 0.3);
            expect(newReturns).to.have.property('6M', 0.4);
            expect(newReturns).to.have.property('3M', 0);
            expect(newReturns).to.have.property('1M', -0.2);
            expect(newReturns).to.have.property('2W', (469 - 486) / 486);
            expect(newReturns).to.have.property('1W', (469 - 475) / 475);
            expect(newReturns).to.have.property('3D', (469 - 472) / 472);
            expect(newReturns).to.have.property('1D', (469 - 472) / 472);
        });
    });


    describe('calcPercentiles', function () {
        const additionalLookbacks = ['2W', '1W', '3D', '1D'];
        const returns = {'5Y': 0.5, '3Y': -0.2, '1Y': 0.3, '6M': 0.4, '3M': 0, '1M': -0.2};
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
        it('should calc correct percentiles', function () {
            const newReturns = math.calcPercentiles(returns, historicPrices, additionalLookbacks);
            const boundary = (469 - 467) / (486 - 467);
            expect(newReturns).to.have.property('5Y', boundary);
            expect(newReturns).to.have.property('3Y', boundary);
            expect(newReturns).to.have.property('1Y', boundary);
            expect(newReturns).to.have.property('6M', boundary);
            expect(newReturns).to.have.property('3M', boundary);
            expect(newReturns).to.have.property('1M', boundary);
            expect(newReturns).to.have.property('2W', boundary);
            expect(newReturns).to.have.property('1W', (469 - 467) / (475 - 467));
            expect(newReturns).to.have.property('3D', (469 - 469) / (472 - 469));
            expect(newReturns).to.have.property('1D', (469 - 469) / (472 - 469));
        });
    });
});