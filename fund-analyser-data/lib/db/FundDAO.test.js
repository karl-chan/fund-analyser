const FundDAO = require('./FundDAO')
const Fund = require('../fund/Fund')
const StreamTest = require('streamtest')

const _ = require('lodash')
const db = require('../util/db')

describe('FundDAO', function () {
    let fund, doc
    beforeAll(async () => {
        await db.init()
    })
    afterAll(async () => {
        await db.close()
    })
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
            .indicators({
                stability: -3
            })
            .build()
        doc = {
            isin: 'test',
            sedol: undefined,
            name: 'Test fund',
            type: Fund.types.UNIT,
            shareClass: Fund.shareClasses.ACC,
            frequency: 'Daily',
            ocf: 0.0007,
            amc: 0.0004,
            entryCharge: 0,
            exitCharge: 0,
            bidAskSpread: undefined,
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
            asof: undefined,
            indicators: {
                stability: -3
            },
            realTimeDetails: undefined
        }
    })
    test('fromFund should return plain object', function () {
        const actual = FundDAO.fromFund(fund)
        expect(_.isPlainObject(actual)).toBeTruthy()
        expect(fund).toMatchObject(actual)
    })
    test('toFund should return Fund object', function () {
        const actual = FundDAO.toFund(doc)
        expect(actual).toBeInstanceOf(Fund)
        expect(actual).toEqual(fund)
    })
    test('upsertFund should upsert Fund object', function (done) {
        FundDAO.upsertFund(fund, (err) => {
            if (err) {
                return done(err)
            }
            db.getFunds().findOneAndDelete({isin: doc.isin}, (err, res) => {
                const found = res.value
                const foundFund = FundDAO.toFund(found)
                expect(foundFund).toEqual(fund)
                done(err)
            })
        })
    })
    test('listFunds should return array of Fund objects', function (done) {
        const options = {limit: 10}
        FundDAO.listFunds(options, (err, funds) => {
            for (let fund of funds) {
                expect(fund).toBeInstanceOf(Fund)
            }
            done(err)
        })
    })
    test('streamFunds should return transform stream of Fund objects', function (done) {
        const options = {limit: 1}
        const fundStream = FundDAO.streamFunds(options)

        const version = 'v2'
        fundStream.pipe(StreamTest[version].toObjects((err, funds) => {
            for (let fund of funds) {
                expect(fund).toBeInstanceOf(Fund)
            }
            done(err)
        }))
    })
})
