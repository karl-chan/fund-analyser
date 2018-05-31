/* eslint-disable no-unused-expressions */

const FinancialTimes = require('./FinancialTimes.js')
const Fund = require('./Fund.js')
const moment = require('moment')

const TIMEOUT = 10000 // 10 seconds

const StreamTest = require('streamtest')

describe('FinancialTimes', function () {
    jest.setTimeout(TIMEOUT)
    let financialTimes, isin1, isin2, fund1, fund2
    beforeEach(function () {
        financialTimes = new FinancialTimes()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('Core methods', function () {
        it('getFundsFromIsins should return array of funds', function (done) {
            isin1 = 'GB00B80QG615'
            isin2 = 'GB00B80QFX11'
            fund1 = Fund.Builder(isin1).build()
            fund2 = Fund.Builder(isin2).build()

            jest.spyOn(financialTimes, 'getFundFromIsin')
                .mockImplementation((isin, callback) => {
                    switch (isin) {
                    case isin1:
                        callback(null, fund1)
                        return
                    case isin2:
                        callback(null, fund2)
                    }
                })

            financialTimes.getFundsFromIsins([isin1, isin2], (err, funds) => {
                expect(funds).toEqual([fund1, fund2])
                done(err)
            })
        })

        it('getFundFromIsin should return fund', function (done) {
            const isin = 'GB00000ISIN0'
            const summary = {
                name: 'My fund',
                type: Fund.types.UNIT,
                shareClass: Fund.shareClasses.ACC,
                frequency: 'Daily',
                ocf: 0.0007,
                amc: 0.0004,
                exitCharge: 0
            }
            const performance = {
                '5Y': 1,
                '3Y': 0.6,
                '1Y': -0.1,
                '6M': 0.06,
                '3M': -0.1,
                '1M': -0.06
            }
            const historicPrices = [
                new Fund.HistoricPrice(new Date(2017, 0, 1), 457.0)
            ]
            const holdings = [
                new Fund.Holding('Apple', 'AAPL', 0.5),
                new Fund.Holding('Alphabet', 'GOOG', 0.5)
            ]

            jest.spyOn(financialTimes, 'getSummary')
                .mockImplementation((isin, callback) => {
                    callback(null, summary)
                })
            jest.spyOn(financialTimes, 'getPerformance')
                .mockImplementation((isin, callback) => {
                    callback(null, performance)
                })
            jest.spyOn(financialTimes, 'getHistoricPrices')
                .mockImplementation((isin, callback) => {
                    callback(null, historicPrices)
                })
            jest.spyOn(financialTimes, 'getHoldings')
                .mockImplementation((isin, callback) => {
                    callback(null, holdings)
                })

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
                .asof(new Date(2017, 0, 1))
                .build()

            financialTimes.getFundFromIsin(isin, (err, actual) => {
                expect(actual).toEqual(expected)
                done(err)
            })
        })

        it('getSummary should return summary object', function (done) {
            financialTimes.getSummary('GB00B80QG615', (err, summary) => {
                expect(summary).toHaveProperty('name', 'HSBC American Index Fund Accumulation C')
                expect(summary).toHaveProperty('type', Fund.types.OEIC)
                expect(summary).toHaveProperty('shareClass', Fund.shareClasses.ACC)
                expect(summary).toHaveProperty('frequency', 'Daily')
                expect(summary).toHaveProperty('ocf')
                expect(summary).toHaveProperty('amc')
                expect(summary).toHaveProperty('entryCharge')
                expect(summary).toHaveProperty('exitCharge')
                expect(summary.ocf).toBeNumber()
                expect(summary.amc).toBeNumber()
                expect(summary.entryCharge).toBeNumber()
                expect(summary.exitCharge).toBeNumber()
                done(err)
            })
        })

        it('getPerformance should return performance object', function (done) {
            financialTimes.getPerformance('GB00B80QG615', (err, performance) => {
                expect(performance).toHaveProperty('5Y')
                expect(performance).toHaveProperty('3Y')
                expect(performance).toHaveProperty('1Y')
                expect(performance).toHaveProperty('6M')
                expect(performance).toHaveProperty('3M')
                expect(performance).toHaveProperty('1M')
                expect(performance['5Y']).not.toBeNaN()
                expect(performance['3Y']).not.toBeNaN()
                expect(performance['1Y']).not.toBeNaN()
                expect(performance['6M']).not.toBeNaN()
                expect(performance['3M']).not.toBeNaN()
                expect(performance['1M']).not.toBeNaN()
                done(err)
            })
        })

        it('getHistoricPrices should return historic prices object', function (done) {
            financialTimes.getHistoricPrices('GB00B80QG615', (err, historicPrices) => {
                expect(historicPrices).toBeArray()
                for (let hp of historicPrices) {
                    expect(moment(hp.date).isValid()).toBeTruthy()
                    expect(moment(hp.price)).not.toBeNaN()
                }
                done(err)
            })
        })

        it('getHoldings should return holdings object', function (done) {
            financialTimes.getHoldings('GB00B80QG615', (err, holdings) => {
                expect(holdings).toBeArray()
                expect(holdings).not.toBeEmpty()

                for (let h of holdings) {
                    expect(h).toHaveProperty('name')
                    expect(h).toHaveProperty('symbol')
                    expect(h).toHaveProperty('weight')
                    expect(h.name).toBeString()
                    expect(h.name).not.toBeEmpty()
                    expect(h.symbol).toBeString()
                    expect(h.weight).toBeNumber()
                    expect(h.weight).not.toBeNaN()
                }
                done(err)
            })
        })
    })

    describe('Stream methods', function () {
        const version = 'v2'
        it('streamFundsFromIsins should return Transform stream outputting array of funds', function (done) {
            isin1 = 'GB00B80QG615'
            isin2 = 'GB00B80QFX11'
            fund1 = Fund.Builder(isin1).build()
            fund2 = Fund.Builder(isin2).build()

            jest.spyOn(financialTimes, 'getFundFromIsin')
                .mockImplementation((isin, callback) => {
                    switch (isin) {
                    case isin1:
                        callback(null, fund1)
                        return
                    case isin2:
                        callback(null, fund2)
                    }
                })

            const isinToFundStream = financialTimes.streamFundsFromIsins()
            StreamTest[version].fromObjects([isin1, isin2])
                .pipe(isinToFundStream)
                .pipe(StreamTest[version].toObjects((err, funds) => {
                    expect(funds).toEqual([fund1, fund2])
                    done(err)
                }))
        })
    })
})
