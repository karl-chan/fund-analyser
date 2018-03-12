const FinancialTimes = require('./FinancialTimes.js');
const Fund = require('./Fund.js');

const TIMEOUT = 10000; // 10 seconds

const chai = require('chai');
const chaiThings = require('chai-things');
const chaiDateString = require('chai-date-string');
const sinon = require('sinon');
chai.should();
chai.use(chaiThings);
chai.use(chaiDateString);
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should;
const StreamTest = require('streamtest');

describe('FinancialTimes', function () {
    this.timeout(TIMEOUT);
    let financialTimes, isin1, isin2, fund1, fund2;
    beforeEach(function () {
        financialTimes = new FinancialTimes();
    });

    describe('Core methods', function () {
        it('getFundsFromIsins should return array of funds', function (done) {
            isin1 = 'GB00B80QG615';
            isin2 = 'GB00B80QFX11';
            fund1 = Fund.Builder(isin1).build();
            fund2 = Fund.Builder(isin2).build();
            const getFundFromIsin = sinon.stub(financialTimes, 'getFundFromIsin');
            getFundFromIsin.withArgs(isin1).yields(null, fund1);
            getFundFromIsin.withArgs(isin2).yields(null, fund2);

            financialTimes.getFundsFromIsins([isin1, isin2], (err, funds) => {
                assert.deepEqual(funds, [fund1, fund2]);
                done(err);
            });
        });

        it('getFundFromIsin should return fund', function (done) {
            const getSummary = sinon.stub(financialTimes, 'getSummary');
            const getPerformance = sinon.stub(financialTimes, 'getPerformance');
            const getHistoricPrices = sinon.stub(financialTimes, 'getHistoricPrices');
            const getHoldings = sinon.stub(financialTimes, 'getHoldings');

            const isin = 'GB00000ISIN0';
            const summary = {
                name: 'My fund',
                type: Fund.types.UNIT,
                shareClass: Fund.shareClasses.ACC,
                frequency: 'Daily',
                ocf: 0.0007,
                amc: 0.0004,
                exitCharge: 0
            };
            const performance = {
                '5Y': 1,
                '3Y': 0.6,
                '1Y': -0.1,
                '6M': 0.06,
                '3M': -0.1,
                '1M': -0.06
            };
            const historicPrices = [
                new Fund.HistoricPrice(new Date(2017, 0, 1), 457.0)
            ];
            const holdings = [
                new Fund.Holding('Apple', 'AAPL', 0.5),
                new Fund.Holding('Alphabet', 'GOOG', 0.5)
            ];
            getSummary.yields(null, summary);
            getPerformance.yields(null, performance);
            getHistoricPrices.yields(null, historicPrices);
            getHoldings.yields(null, holdings);

            const expected = Fund.Builder(isin)
                .name('My fund')
                .type(Fund.types.UNIT)
                .shareClass(Fund.shareClasses.ACC)
                .frequency('Daily')
                .ocf(0.0007)
                .amc(0.0004)
                .exitCharge(0)
                .holdings(holdings)
                .historicPrices(historicPrices)
                .returns(performance)
                .build();

            financialTimes.getFundFromIsin(isin, (err, actual) => {
                assert.deepEqual(actual, expected);
                done(err);
            });
        });

        it('getSummary should return summary object', function (done) {
            financialTimes.getSummary('GB00B80QG615', (err, summary) => {
                expect(summary).to.have.property('name', 'HSBC American Index Fund Accumulation C');
                expect(summary).to.have.property('type', Fund.types.OEIC);
                expect(summary).to.have.property('shareClass', Fund.shareClasses.ACC);
                expect(summary).to.have.property('frequency', 'Daily');
                expect(summary).to.have.property('ocf').that.is.a('number').and.not.to.be.NaN;
                expect(summary).to.have.property('amc').that.is.a('number').and.not.to.be.NaN;
                expect(summary).to.have.property('entryCharge').that.is.a('number').and.to.be.NaN;
                expect(summary).to.have.property('exitCharge').that.is.a('number').and.not.to.be.NaN;
                done(err);
            });
        });

        it('getPerformance should return performance object', function (done) {
            financialTimes.getPerformance('GB00B80QG615', (err, performance) => {
                expect(performance).to.have.property('5Y').that.is.a('number').and.not.to.be.NaN;
                expect(performance).to.have.property('3Y').that.is.a('number').and.not.to.be.NaN;
                expect(performance).to.have.property('1Y').that.is.a('number').and.not.to.be.NaN;
                expect(performance).to.have.property('6M').that.is.a('number').and.not.to.be.NaN;
                expect(performance).to.have.property('3M').that.is.a('number').and.not.to.be.NaN;
                expect(performance).to.have.property('1M').that.is.a('number').and.not.to.be.NaN;
                done(err);
            });
        });

        it('getHistoricPrices should return historic prices object', function (done) {
            financialTimes.getHistoricPrices('GB00B80QG615', (err, historicPrices) => {
                expect(historicPrices).to.be.an('array');
                historicPrices[0].should.have.property('date').that.is.a.dateString();
                historicPrices[0].should.have.property('price').that.is.a('number').and.not.to.be.NaN;
                done(err);
            });
        });

        it('getHoldings should return holdings object', function (done) {
            financialTimes.getHoldings('IE00BLP58G83', (err, holdings) => {
                expect(holdings).to.be.an('array').and.not.to.be.empty;
                holdings[0].should.have.property('name').that.is.a('string').and.not.to.be.empty;
                holdings[0].should.have.property('symbol').that.is.a('string').and.not.to.be.empty;
                holdings[0].should.have.property('weight').that.is.a('number').and.not.to.be.NaN;
                done(err);
            });
        });
    });

    describe('Stream methods', function () {
        version = 'v2';
        it('streamFundsFromIsins should return Transform stream outputting array of funds', function (done) {
            isin1 = 'GB00B80QG615';
            isin2 = 'GB00B80QFX11';
            fund1 = Fund.Builder(isin1).build();
            fund2 = Fund.Builder(isin2).build();
            const getFundFromIsin = sinon.stub(financialTimes, 'getFundFromIsin');
            getFundFromIsin.withArgs(isin1).yields(null, fund1);
            getFundFromIsin.withArgs(isin2).yields(null, fund2);

            const isinToFundStream = financialTimes.streamFundsFromIsins();
            StreamTest[version].fromObjects([isin1, isin2])
                .pipe(isinToFundStream)
                .pipe(StreamTest[version].toObjects((err, funds) => {
                    assert.deepEqual(funds, [fund1, fund2]);
                    done(err);
                }));
        });
    });
});