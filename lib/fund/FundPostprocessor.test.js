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
    const percentiles = {
        '5Y': 0.2,
        '3Y': 0.3,
        '1Y': 0.8,
        '6M': 0.75,
        '3M': 0.9,
        '1M': 0.4,
        '2W': 0.5,
        '1W': 0.2,
        '3D': 0.6,
        '1D': 0.6
    };


    beforeEach(function () {
        fundPostprocessor = new FundPostprocessor();
        fund = Fund.Builder('GB00000ISIN0')
            .historicPrices(historicPrices)
            .returns(returns)
            .build();
    });

    it('postprocess should postprocess fund', function (done) {
        const newReturns = _.assign(returns, {
            '2W': 0.01,
            '1W': 0.005
        });
        const fundWithNewReturns = Fund.Builder('GB00000ISIN0')
            .historicPrices(historicPrices)
            .returns(newReturns)
            .build();
        const fundWithPercentiles = Fund.Builder('GB00000ISIN0')
            .historicPrices(historicPrices)
            .returns(newReturns)
            .percentiles(percentiles)
            .build();

        sinon.stub(fundPostprocessor, 'enrichReturns')
            .withArgs(fund)
            .yields(null, fundWithNewReturns);
        sinon.stub(fundPostprocessor, 'calcPercentiles')
            .withArgs(fund)
            .yields(null, fundWithPercentiles);
        fundPostprocessor.postprocess(fund, (err, actual) => {
            assert.deepEqual(actual, fundWithPercentiles);
            done(err);
        });
    });

    it('stream should return a Transform stream that postprocesses fund', function (done) {
        const newReturns = _.assign(returns, {
            '2W': 0.01,
            '1W': 0.005
        });
        const expected = Fund.Builder('GB00000ISIN0')
            .historicPrices(historicPrices)
            .returns(newReturns)
            .percentiles(percentiles)
            .build();

        const version = 'v2';
        sinon.stub(fundPostprocessor, 'postprocess')
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
});