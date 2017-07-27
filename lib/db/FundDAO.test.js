const FundDAO = require('./FundDAO.js');
const Fund = require('../fund/Fund.js');
const StreamTest = require('streamtest');

const _ = require('lodash');
const db = require('../util/db.js');
const chai = require('chai');
const chaiThings = require('chai-things');
chai.should();
chai.use(chaiThings);
const assert = chai.assert;
const should = chai.should;

describe('FundDAO', function () {
    let fund, dao, dao2;
    before(function (done) {
        db.init(done);
    });
    beforeEach(function () {
        fund = Fund.Builder('test')
            .name('Test fund')
            .type(Fund.types.UNIT)
            .shareClass(Fund.shareClasses.ACC)
            .frequency('Daily')
            .ocf(0.0007)
            .amc(0.0004)
            .entryCharge(0)
            .exitCharge(0)
            .holdings([new Fund.Holding('Test Holding', 'TEST', 0)])
            .historicPrices([new Fund.HistoricPrice(new Date(2017, 3, 23), 457.0)])
            .returns({'5Y': 0.5, '3Y': -0.2, '1Y': 0.3, '6M': 0.4, '3M': 0, '1M': -0.2})
            .percentiles({
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
            })
            .build();
        dao = new FundDAO({
            _id: 'test',
            isin: 'test',
            name: 'Test fund',
            type: Fund.types.UNIT,
            shareClass: Fund.shareClasses.ACC,
            frequency: 'Daily',
            ocf: 0.0007,
            amc: 0.0004,
            entryCharge: 0,
            exitCharge: 0,
            holdings: [{
                name: 'Test Holding',
                symbol: 'TEST',
                weight: 0
            }],
            historicPrices: [{
                date: new Date(2017, 3, 23),
                price: 457.0
            }],
            returns: {'5Y': 0.5, '3Y': -0.2, '1Y': 0.3, '6M': 0.4, '3M': 0, '1M': -0.2},
            percentiles: {
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
            }
        });
        dao2 = _.clone(dao);
    });
    it('fromFund should return FundDAO object', function () {
        const actual = FundDAO.fromFund(fund);
        assert.isTrue(actual.equals(dao));
    });
    it('toFund should return Fund object', function () {
        const actual = FundDAO.toFund(dao);
        assert.isTrue(actual.equals(fund));
    });
    it('upsertFund should upsert Fund object', function (done) {
        FundDAO.upsertFund(fund, (err) => {
            db.getFunds().findOneAndDelete({_id: dao._id}, (err, res) => {
                const found = res.value;
                const foundFund = FundDAO.toFund(found);
                assert.isTrue(foundFund.equals(fund));
                done(err);
            });
        });
    });
    it('upsertFund should remove obsolete record', function (done) {
        const obsoleteFund = _.clone(fund);
        obsoleteFund.name = '';
        FundDAO.upsertFund(obsoleteFund, (err) => {
            db.getFunds().findOneAndDelete({_id: dao._id}, (err, res) => {
                assert.isNull(res.value);
                done(err);
            });
        });

    });
    it('listFunds should return array of Fund objects', function (done) {
        const options = {limit: 10};
        FundDAO.listFunds(options, (err, funds) => {
            funds.should.all.be.an.instanceOf(Fund);
            done(err);
        });
    });
    it('streamFunds should return transform stream of Fund objects', function (done) {
        const options = {limit: 1};
        const fundStream = FundDAO.streamFunds(options);

        const version = 'v2';
        fundStream.pipe(StreamTest[version].toObjects((err, funds) => {
            funds.should.all.be.an.instanceOf(Fund);
            done(err);
        }));
    });

    it('equals should return true for equal FundDAO objects', function () {
        assert.isTrue(dao.equals(dao2));
    });

    it('equals should return false for different fund name', function () {
        dao2.name = 'Different';
        assert.isFalse(dao.equals(dao2));
    });
    it('equals should return false for different fund type', function () {
        dao2.type = Fund.types.OEIC;
        assert.isFalse(dao.equals(dao2));
    });
    it('equals should return false for different share classes', function () {
        dao2.shareClass = Fund.shareClasses.OEIC;
        assert.isFalse(dao.equals(dao2));
    });
    it('equals should return false for different pricing frequencies', function () {
        dao2.frequency = 'Weekly';
        assert.isFalse(dao.equals(dao2));
    });
    it('equals should return false for different ongoing fund charge', function () {
        dao2.ocf = 0;
        assert.isFalse(dao.equals(dao2));
    });
    it('equals should return false for different annual management charge', function () {
        dao2.amc = 0;
        assert.isFalse(dao.equals(dao2));
    });
    it('equals should return false for different entry charge', function () {
        dao2.entryCharge = 100;
        assert.isFalse(dao.equals(dao2));
    });
    it('equals should return false for different exit charge', function () {
        dao2.exitCharge = 100;
        assert.isFalse(dao.equals(dao2));
    });
    it('equals should return false for different holdings', function () {
        dao2.holdings = [{
            holdings: 'Different Holding',
            symbol: 'TEST',
            weight: 0
        }];
        assert.isFalse(dao.equals(dao2));
    });
    it('equals should return false for different historic prices', function () {
        dao2.historicPrices = [{
            date: new Date(2001, 1, 1),
            price: 457.0
        }];
        assert.isFalse(dao.equals(dao2));
    });
    it('equals should return false for different returns', function () {
        dao2.returns = {'5Y': 0.5, '3Y': -0.2, '1Y': 0.3, '6M': 0.4, '3M': 0, '1M': 0};
        assert.isFalse(dao.equals(dao2));
    });
    it('equals should return false for different percentiles', function () {
        dao2.percentiles = {'5Y': 0.5, '3Y': -0.2, '1Y': 0.3, '6M': 0.4, '3M': 0, '1M': 0};
        assert.isFalse(dao.equals(dao2));
    });
});