const FinancialTimes = require('./FinancialTimes')
const Fund = require('./Fund')
const Currency = require('../currency/Currency')
const moment = require('moment')

const StreamTest = require('streamtest')

jest.setTimeout(30000) // 30 seconds

describe('FinancialTimes', function () {
    let financialTimes, isin1, isin2, fund1, fund2
    beforeEach(function () {
        financialTimes = new FinancialTimes()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('Core methods', function () {
        test('getFundsFromIsins should return array of funds', async () => {
            const isin1 = 'GB00B80QG615'
            const isin2 = 'GB00B80QFX11'
            const fund1 = Fund.Builder(isin1).build()
            const fund2 = Fund.Builder(isin2).build()

            jest.spyOn(financialTimes, 'getFundFromIsin')
                .mockImplementation(async isin => {
                    switch (isin) {
                    case isin1:
                        return fund1
                    case isin2:
                        return fund2
                    }
                })

            const funds = await financialTimes.getFundsFromIsins([isin1, isin2])
            expect(funds).toEqual([fund1, fund2])
        })

        test('getFundFromIsin should return fund', async () => {
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
                .mockImplementation(async (isin) => summary)
            jest.spyOn(financialTimes, 'getPerformance')
                .mockImplementation(async (isin) => performance)
            jest.spyOn(financialTimes, 'getHistoricPrices')
                .mockImplementation(async (isin) => historicPrices)
            jest.spyOn(financialTimes, 'getHoldings')
                .mockImplementation(async (isin) => holdings)

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
            expected.realTimeDetails = expect.any(Object)

            const actual = await financialTimes.getFundFromIsin(isin)
            expect(actual).toMatchObject(expected)
        })

        test('getSummary should return summary object', async () => {
            const summary = await financialTimes.getSummary('GB00B80QG615')
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
        })

        test('getPerformance should return performance object', async () => {
            const performance = await financialTimes.getPerformance('GB00B80QG615')
            expect(performance['5Y']).toBeNumber().not.toBeNaN()
            expect(performance['3Y']).toBeNumber().not.toBeNaN()
            expect(performance['1Y']).toBeNumber().not.toBeNaN()
            expect(performance['6M']).toBeNumber().not.toBeNaN()
            expect(performance['3M']).toBeNumber().not.toBeNaN()
            expect(performance['1M']).toBeNumber().not.toBeNaN()
        })

        test('getHistoricPrices should return historic prices object', async () => {
            const historicPrices = await financialTimes.getHistoricPrices('GB00B80QG615')
            expect(historicPrices).toBeArray()
            expect(historicPrices).toSatisfyAll(hp => hp instanceof Fund.HistoricPrice)
            expect(historicPrices).not.toBeEmpty()
            for (let hp of historicPrices) {
                expect(moment(hp.date).isValid()).toBeTrue()
                expect(hp.price).toBeNumber().not.toBeNaN()
            }
        })

        test('getHistoricExchangeRates should return historic exchange rates series', async () => {
            const historicRates = await financialTimes.getHistoricExchangeRates('GBP', 'USD')
            expect(historicRates).toBeArray()
            expect(historicRates).toSatisfyAll(hr => hr instanceof Currency.HistoricRate)
            expect(historicRates).not.toBeEmpty()
            for (let hr of historicRates) {
                expect(moment(hr.date).isValid()).toBeTrue()
                expect(hr.rate).not.toBeNaN()
            }
        })

        test('getHoldings should return holdings object', async () => {
            const holdings = await financialTimes.getHoldings('GB00B80QG615')
            expect(holdings).toBeArray()
            expect(holdings).not.toBeEmpty()

            for (let h of holdings) {
                expect(h).toHaveProperty('name')
                expect(h).toHaveProperty('symbol')
                expect(h).toHaveProperty('weight')
                expect(h.name).toBeString().not.toBeEmpty()
                expect(h.symbol).toBeString().not.toBeEmpty()
                expect(h.weight).toBeFinite()
            }
        })

        test('getRealTimeDetails should return real time details object', async () => {
            const isin = 'GB00B80QG615'
            const historicPrices = [
                new Fund.HistoricPrice(new Date(2017, 0, 1), 457.0)
            ]
            const holdings = [
                new Fund.Holding('Apple', 'AAPL', 0.5),
                new Fund.Holding('Alphabet', 'GOOG', 0.5)
            ]
            const fund = Fund.Builder(isin)
                .historicPrices(historicPrices)
                .holdings(holdings)
                .build()

            const realTimeDetails = await financialTimes.getRealTimeDetails(fund)
            expect(realTimeDetails).toHaveProperty('estChange')
            expect(realTimeDetails).toHaveProperty('estPrice')
            expect(realTimeDetails).toHaveProperty('stdev')
            expect(realTimeDetails).toHaveProperty('ci')
            expect(realTimeDetails).toHaveProperty('holdings')
            expect(realTimeDetails.estChange).not.toBe(0)
            expect(realTimeDetails.estPrice).toBePositive()
            expect(realTimeDetails.stdev).toBePositive()
            expect(realTimeDetails.ci).toBeArrayOfSize(2)
            expect(realTimeDetails.holdings).toBeArrayOfSize(2)
            expect(realTimeDetails.holdings).toSatisfyAll(h => h.currency && typeof h.currency === 'string' && h.currency.length === 3)
            expect(realTimeDetails.holdings).toSatisfyAll(h => h.todaysChange && typeof h.todaysChange === 'number')
        })

        test('listCurrencies should return list of available currencies', async () => {
            const currencies = await financialTimes.listCurrencies()
            expect(currencies).toBeArray()
            expect(currencies).toIncludeAllMembers(['GBP', 'USD', 'CNY', 'EUR', 'BRL'])
        })

        test('getSymbolFromName should return symbol for fund name', async () => {
            const aia = await financialTimes.getSymbolFromName('AIA Group Ltd')
            expect(aia).toBe('1299:HKG')

            // drop the prefix
            const homeDepot = await financialTimes.getSymbolFromName('The Home Depot Inc')
            expect(homeDepot).toBe('HD:NYQ')

            // drop suffix
            const alphabet = await financialTimes.getSymbolFromName('Alphabet Inc Class C')
            expect(alphabet).toBe('GOOGL:NSQ')

            const notFound = await financialTimes.getSymbolFromName('Non existent fund name')
            expect(notFound).toBeUndefined()
        })
    })

    describe('Stream methods', function () {
        const version = 'v2'
        test('streamFundsFromIsins should return Transform stream outputting array of funds', done => {
            isin1 = 'GB00B80QG615'
            isin2 = 'GB00B80QFX11'
            fund1 = Fund.Builder(isin1).build()
            fund2 = Fund.Builder(isin2).build()

            jest.spyOn(financialTimes, 'getFundFromIsin')
                .mockImplementation(async isin => {
                    switch (isin) {
                    case isin1:
                        return fund1
                    case isin2:
                        return fund2
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
