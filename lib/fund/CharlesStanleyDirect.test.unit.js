const CharlesStanleyDirect = require('./CharlesStanleyDirect.js');

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
            const isins = ['GB00000ISIN1', 'GB00000ISIN2'];

            const getPageRange = sinon.stub(charlesStanleyDirect, 'getPageRange');
            const getSedolsFromPages = sinon.stub(charlesStanleyDirect, 'getSedolsFromPages');
            const getIsinsFromSedols = sinon.stub(charlesStanleyDirect, 'getIsinsFromSedols');

            getPageRange.yields(null, pageRange);
            getSedolsFromPages.withArgs(pageRange).yields(null, sedols);
            getIsinsFromSedols.withArgs(sedols).yields(null, isins);

            charlesStanleyDirect.getIsins((err, actual) => {
                assert.deepEqual(actual, isins);
                done(err);
            });
        });

        it('getNumPages should return positive integer', function (done) {
            charlesStanleyDirect.getNumPages((err, numPages) => {
                assert.equal(numPages, 71);
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

        it('getIsinFromSedol should return isin', function (done) {
            const sedol = 'BD2MWC0';
            charlesStanleyDirect.getIsinFromSedol(sedol, (err, isin) => {
                assert.equal(isin, 'LU1379000331');
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

        it('getIsinsFromSedols should return array of isins', function (done) {
            const sedols = ['SEDOL01', 'SEDOL02'];
            const getIsinFromSedol = sinon.stub(charlesStanleyDirect, 'getIsinFromSedol');
            getIsinFromSedol.withArgs('SEDOL01').yields(null, 'GB00000ISIN1');
            getIsinFromSedol.withArgs('SEDOL02').yields(null, 'GB00000ISIN2');
            charlesStanleyDirect.getIsinsFromSedols(sedols, (err, isins) => {
                assert.deepEqual(isins, ['GB00000ISIN1', 'GB00000ISIN2']);
                done(err);
            });
        });
    });

    describe('Stream methods', function () {
        const version = 'v2';
        it('streamIsins should return Readable stream outputting array of isins', function (done) {
            const pageRange = [1, 2];
            const sedols = ['SEDOL01', 'SEDOL02'];
            const isins = ['GB00000ISIN1', 'GB00000ISIN2'];

            const getNumPages = sinon.stub(charlesStanleyDirect, 'getNumPages');
            const getPageRange = sinon.stub(charlesStanleyDirect, 'getPageRange');
            const getSedolsFromPage = sinon.stub(charlesStanleyDirect, 'getSedolsFromPage');
            const getIsinsFromSedol = sinon.stub(charlesStanleyDirect, 'getIsinFromSedol');

            getNumPages.yields(null, 2);
            getPageRange.yields(null, pageRange);
            getSedolsFromPage.withArgs(1).yields(null, 'SEDOL01');
            getSedolsFromPage.withArgs(2).yields(null, 'SEDOL02');
            getIsinsFromSedol.withArgs('SEDOL01').yields(null, 'GB00000ISIN1');
            getIsinsFromSedol.withArgs('SEDOL02').yields(null, 'GB00000ISIN2');

            const isinStream = charlesStanleyDirect.streamIsins();
            isinStream
                .pipe(StreamTest[version].toObjects((err, actual) => {
                    assert.deepEqual(actual, isins);
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
        it('streamIsinsFromSedols should return Transform stream outputting array of isins', function (done) {
            const sedols = ['SEDOL01', 'SEDOL02'];
            const getIsinFromSedol = sinon.stub(charlesStanleyDirect, 'getIsinFromSedol');
            getIsinFromSedol.withArgs('SEDOL01').yields(null, 'GB00000ISIN1');
            getIsinFromSedol.withArgs('SEDOL02').yields(null, 'GB00000ISIN2');

            const sedolToIsinStream = charlesStanleyDirect.streamIsinsFromSedols();
            StreamTest[version].fromObjects(sedols)
                .pipe(sedolToIsinStream)
                .pipe(StreamTest[version].toObjects((err, isins) => {
                    assert.deepEqual(isins, ['GB00000ISIN1', 'GB00000ISIN2']);
                    done(err);
                }));
        });
    });
});