const CharlesStanleyDirect = require('./CharlesStanleyDirect.js');
const Fund = require('./Fund.js');

const TIMEOUT = 30000; // 30 seconds

const _ = require('lodash');
const chai = require('chai');
const chaiThings = require('chai-things');
const sinon = require('sinon');
chai.should();
chai.use(chaiThings);
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should;
const StreamTest = require('streamtest');

describe('CharlesStanleyDirect', function () {
    this.timeout(TIMEOUT);
    let charlesStanleyDirect;
    beforeEach(function () {
        charlesStanleyDirect = new CharlesStanleyDirect();
    });

    describe('Core methods', function () {
        it('getIsins should return array of isins', function (done) {
            const pageRange = [1, 2];
            const sedols = ['SEDOL01', 'SEDOL02'];
            const partialFunds = [
                Fund.Builder('GB00000ISIN1').bidAskSpread(0.01),
                Fund.Builder('GB00000ISIN2').bidAskSpread(0.02)
            ];

            const getPageRange = sinon.stub(charlesStanleyDirect, 'getPageRange');
            const getSedolsFromPages = sinon.stub(charlesStanleyDirect, 'getSedolsFromPages');
            const getFundsFromSedols = sinon.stub(charlesStanleyDirect, 'getFundsFromSedols');

            getPageRange.yields(null, pageRange);
            getSedolsFromPages.withArgs(pageRange).yields(null, sedols);
            getFundsFromSedols.withArgs(sedols).yields(null, partialFunds);

            charlesStanleyDirect.getFunds((err, actual) => {
                assert.deepEqual(actual, partialFunds);
                done(err);
            });
        });

        it('getNumPages should return positive integer', function (done) {
            charlesStanleyDirect.getNumPages((err, numPages) => {
                assert.equal(numPages, 73);
                done(err);
            });
        });

        it('getSedolsFromPage should return array of sedols', function (done) {
            const sample_page = 1;
            charlesStanleyDirect.getSedolsFromPage(sample_page, (err, sedols) => {
                expect(sedols).to.be.an('array');
                sedols.should.all.have.lengthOf(7);
                done(err);
            });
        });

        it('getFundFromSedol should return partial fund', function (done) {
            const sedol = 'B8N44B3';
            charlesStanleyDirect.getFundFromSedol(sedol, (err, partialFund) => {
                assert.equal(partialFund.isin, 'GB00B8N44B34');
                expect(partialFund).to.have.property('bidAskSpread').that.is.a('number');
                expect(partialFund).to.have.property('entryCharge').that.is.a('number');
                done(err);
            });
        });

        it('getPageRange should return array of consecutive ints', function (done) {
            const lastPage = 71;
            charlesStanleyDirect.getPageRange(lastPage, (err, pageRange) => {
                assert.deepEqual(pageRange, _.range(1, lastPage + 1));
                done(err);
            });
        });

        it('getSedolsFromPages should return array of sedols', function (done) {
            const pages = [1, 2];
            const getSedolsFromPage = sinon.stub(charlesStanleyDirect, 'getSedolsFromPage');
            getSedolsFromPage.withArgs(1).yields(null, ['SEDOL01', 'SEDOL02']);
            getSedolsFromPage.withArgs(2).yields(null, ['SEDOL03', 'SEDOL04']);
            charlesStanleyDirect.getSedolsFromPages(pages, (err, sedols) => {
                assert.deepEqual(sedols, ['SEDOL01', 'SEDOL02', 'SEDOL03', 'SEDOL04']);
                done(err);
            });
        });

        it('getFundsFromSedols should return array of partial fund', function (done) {
            const sedols = ['SEDOL01', 'SEDOL02'];
            const partialFunds = [
                Fund.Builder('GB00000ISIN1').bidAskSpread(0.01),
                Fund.Builder('GB00000ISIN2').bidAskSpread(0.02)
            ];
            const getFundFromSedol = sinon.stub(charlesStanleyDirect, 'getFundFromSedol');
            getFundFromSedol.withArgs('SEDOL01').yields(null, partialFunds[0]);
            getFundFromSedol.withArgs('SEDOL02').yields(null, partialFunds[1]);
            charlesStanleyDirect.getFundsFromSedols(sedols, (err, isins) => {
                assert.deepEqual(isins, partialFunds);
                done(err);
            });
        });
    });

    describe('Stream methods', function () {
        const version = 'v2';
        it('streamFunds should return Readable stream outputting array of partial funds', function (done) {
            const pageRange = [1, 2];
            const sedols = ['SEDOL01', 'SEDOL02'];
            const partialFunds = [
                Fund.Builder('GB00000ISIN1').bidAskSpread(0.01),
                Fund.Builder('GB00000ISIN2').bidAskSpread(0.02)
            ];

            const getNumPages = sinon.stub(charlesStanleyDirect, 'getNumPages');
            const getPageRange = sinon.stub(charlesStanleyDirect, 'getPageRange');
            const getSedolsFromPage = sinon.stub(charlesStanleyDirect, 'getSedolsFromPage');
            const getFundFromSedol = sinon.stub(charlesStanleyDirect, 'getFundFromSedol');

            getNumPages.yields(null, 2);
            getPageRange.yields(null, pageRange);
            getSedolsFromPage.withArgs(1).yields(null, 'SEDOL01');
            getSedolsFromPage.withArgs(2).yields(null, 'SEDOL02');
            getFundFromSedol.withArgs('SEDOL01').yields(null, partialFunds[0]);
            getFundFromSedol.withArgs('SEDOL02').yields(null, partialFunds[1]);

            const isinStream = charlesStanleyDirect.streamFunds();
            isinStream
                .pipe(StreamTest[version].toObjects((err, actual) => {
                    assert.deepEqual(actual, partialFunds);
                    done(err);
                }));
        });
        it('streamNumPages should return Readable stream with single element', function (done) {
            const getNumPages = sinon.stub(charlesStanleyDirect, 'getNumPages');
            getNumPages.yields(null, 71);

            const numPagesStream = charlesStanleyDirect.streamNumPages();
            numPagesStream.pipe(StreamTest[version].toObjects((err, objs) => {
                assert.deepEqual(objs, [71]);
                done(err);
            }));
        });
        it('streamPageRange should return Transform stream outputting array of consecutive ints', function (done) {
            const lastPage = 71;
            const getPageRange = sinon.stub(charlesStanleyDirect, 'getPageRange');
            getPageRange.withArgs(lastPage).yields(null, _.range(1, 72));

            const pageRangeStream = charlesStanleyDirect.streamPageRange();
            StreamTest[version].fromObjects([lastPage])
                .pipe(pageRangeStream)
                .pipe(StreamTest[version].toObjects((err, pageRange) => {
                    assert.deepEqual(pageRange, _.range(1, 72));
                    done(err);
                }));
        });
        it('streamSedolsFromPages should return Transform stream outputting array of sedols', function (done) {
            const pages = [1, 2];
            const getSedolsFromPage = sinon.stub(charlesStanleyDirect, 'getSedolsFromPage');
            getSedolsFromPage.withArgs(1).yields(null, ['SEDOL01', 'SEDOL02']);
            getSedolsFromPage.withArgs(2).yields(null, ['SEDOL03', 'SEDOL04']);

            const pageToSedolStream = charlesStanleyDirect.streamSedolsFromPages();
            StreamTest[version].fromObjects(pages)
                .pipe(pageToSedolStream)
                .pipe(StreamTest[version].toObjects((err, sedols) => {
                    assert.deepEqual(sedols, ['SEDOL01', 'SEDOL02', 'SEDOL03', 'SEDOL04']);
                    done(err);
                }));
        });
        it('streamFundsFromSedols should return Transform stream outputting array of partial funds', function (done) {
            const sedols = ['SEDOL01', 'SEDOL02'];
            const partialFunds = [
                Fund.Builder('GB00000ISIN1').bidAskSpread(0.01),
                Fund.Builder('GB00000ISIN2').bidAskSpread(0.02)
            ];

            const getFundFromSedol = sinon.stub(charlesStanleyDirect, 'getFundFromSedol');
            getFundFromSedol.withArgs('SEDOL01').yields(null, partialFunds[0]);
            getFundFromSedol.withArgs('SEDOL02').yields(null, partialFunds[1]);

            const sedolToIsinStream = charlesStanleyDirect.streamFundsFromSedols();
            StreamTest[version].fromObjects(sedols)
                .pipe(sedolToIsinStream)
                .pipe(StreamTest[version].toObjects((err, isins) => {
                    assert.deepEqual(isins, partialFunds);
                    done(err);
                }));
        });
    });
});