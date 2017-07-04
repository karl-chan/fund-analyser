const FundFactory = require('./FundFactory.js');
const Fund = require('./Fund.js');
const stream = require('stream');

const chai = require('chai');
const sinon = require('sinon');
const assert = chai.assert;
const StreamTest = require('streamtest');

describe('FundFactory', function () {
    let fundFactory;

    beforeEach(function () {
        fundFactory = new FundFactory();
    });

    it('getFunds should return array of funds', function (done) {
        const expected = [
            Fund.Builder('GB00000ISIN0').build(),
            Fund.Builder('GB00000ISIN1').build()
        ];
        sinon.stub(fundFactory.isinProvider, 'getIsins')
            .yields(null, ['GB00000ISIN0', 'GB00000ISIN1']);
        sinon.stub(fundFactory.fundProvider, 'getFundsFromIsins')
            .withArgs(['GB00000ISIN0', 'GB00000ISIN1']).yields(null, expected);
        sinon.stub(fundFactory.fundCalculator, 'evaluate')
            .withArgs(expected).yields(null, expected);
        fundFactory.getFunds((err, actual) => {
            assert.deepEqual(actual, expected);
            done(err);
        });
    });

    it('streamFunds should return a Transform stream outputting array of funds', function (done) {
        const isin1 = 'GB00000ISIN0';
        const isin2 = 'GB00000ISIN1';
        const fund1 = Fund.Builder(isin1).build();
        const fund2 = Fund.Builder(isin2).build();

        const version = 'v2';
        const isinStream = StreamTest[version].fromObjects([isin1, isin2]);
        const isinToFundStream = new stream.Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                switch (chunk) {
                    case isin1:
                        return callback(null, fund1);
                    case isin2:
                        return callback(null, fund2);
                    default:
                        return callback(new Error(`Unrecognised isin: ${chunk}`));
                }
            }
        });
        const fundCalculationStream = new stream.Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                callback(null, chunk);
            }
        });
        sinon.stub(fundFactory.isinProvider, 'streamIsins')
            .returns(isinStream);
        sinon.stub(fundFactory.fundProvider, 'streamFundsFromIsins')
            .returns(isinToFundStream);
        sinon.stub(fundFactory.fundCalculator, 'stream')
            .returns(fundCalculationStream);

        fundFactory.streamFunds()
            .pipe(StreamTest[version].toObjects((err, funds) => {
                assert.deepEqual(funds, [fund1, fund2]);
                done(err);
            }));
    });
});