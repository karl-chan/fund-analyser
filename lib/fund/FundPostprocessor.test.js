const FundPostprocessor = require('./FundPostprocessor.js');
const Fund = require('./Fund.js');
const stream = require('stream');

const _ = require('lodash');

const chai = require('chai');
const sinon = require('sinon');
const assert = chai.assert;
const expect = chai.expect;
const StreamTest = require('streamtest');

describe('FundPostprocessor', function () {
    let fundPostprocessor, fund;
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

    beforeEach(function () {
        fundPostprocessor = new FundPostprocessor();
        fund = Fund.Builder('GB00000ISIN0')
            .historicPrices(historicPrices)
            .returns(returns)
            .build();
    });

    it('apply should postprocess fund', function (done) {
        const newReturns = _.assign(returns, {
            '2W': 0.01,
            '1W': 0.005
        });
        const expected = Fund.Builder('GB00000ISIN0')
            .historicPrices(historicPrices)
            .returns(newReturns)
            .build();

        sinon.stub(fundPostprocessor, 'applyOnReturns')
            .withArgs(fund)
            .yields(null, expected);
        fundPostprocessor.apply(fund, (err, actual) => {
            assert.deepEqual(actual, expected);
            done(err);
        });
    });

    it('streamFunds should return a Transform stream that postprocesses fund', function (done) {
        const newReturns = _.assign(returns, {
            '2W': 0.01,
            '1W': 0.005
        });
        const expected = Fund.Builder('GB00000ISIN0')
            .historicPrices(historicPrices)
            .returns(newReturns)
            .build();

        const version = 'v2';
        sinon.stub(fundPostprocessor, 'apply')
            .withArgs(fund)
            .yields(null, expected);

        const fundStream = StreamTest[version].fromObjects([fund]);
        fundStream
            .pipe(fundPostprocessor.stream())
            .pipe(StreamTest[version].toObjects((err, funds) => {
                assert.deepEqual(funds, [expected]);
                done(err);
            }));
    });

    it('applyOnReturns should postprocess returns in fund', function (done) {
        fundPostprocessor.applyOnReturns(fund, (err, actual) => {
            expect(actual.returns).to.contain.all.keys(returns);
            expect(actual.returns).to.have.property('2W', (469 - 486) / 486);
            expect(actual.returns).to.have.property('1W', (469 - 475) / 475);
            expect(actual.returns).to.have.property('3D', (469 - 472) / 472);
            expect(actual.returns).to.have.property('3D', (469 - 472) / 472);
            done(err);
        })
    })
});