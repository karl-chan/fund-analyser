import moment from 'moment'
import * as StreamTest from 'streamtest'
import Currency from '../currency/Currency'
import FinancialTimes from './FinancialTimes'
import Fund from './Fund'

jest.setTimeout(30000) // 30 seconds

describe('FinancialTimes', function () {
  let financialTimes: FinancialTimes
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
      const fund1 = Fund.builder(isin1).build()
      const fund2 = Fund.builder(isin2).build()

      jest.spyOn(financialTimes, 'getFundFromIsin')
        .mockImplementation(async fund => fund)

      const funds = await financialTimes.getFundsFromIsins([fund1, fund2])
      expect(funds).toEqual([fund1, fund2])
    })

    test('getFundFromIsin should return fund', async () => {
      const csdFund = Fund.builder('GB00000ISIN0').build()
      const summary = {
        name: 'My fund',
        type: Fund.types.UNIT,
        shareClass: Fund.shareClasses.ACC,
        frequency: 'Daily',
        ocf: 0.0007,
        amc: 0.0004,
        entryCharge: 0,
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
        .mockImplementation(async () => summary)
      jest.spyOn(financialTimes, 'getPerformance')
        .mockImplementation(async () => performance)
      jest.spyOn(financialTimes, 'getHistoricPrices')
        .mockImplementation(async () => historicPrices)
      jest.spyOn(financialTimes, 'getHoldings')
        .mockImplementation(async () => holdings)

      const expected = Fund.builder(csdFund.isin)
        .name('My fund')
        .type(Fund.types.UNIT)
        .shareClass(Fund.shareClasses.ACC)
        .frequency('Daily')
        .entryCharge(undefined) // csd takes precedence
        .exitCharge(0)
        .holdings(holdings)
        .historicPrices(historicPrices)
        .returns(performance)
        .asof(new Date(2017, 0, 1))
        .build()
      expected.realTimeDetails = expect.any(Object)

      const actual = await financialTimes.getFundFromIsin(csdFund)
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
      const historicPrices = await financialTimes.getHistoricPrices('GB00B3K7SR40')
      expect(historicPrices).toBeArray().not.toBeEmpty()
      expect(historicPrices).toSatisfyAll(hp => {
        return hp instanceof Fund.HistoricPrice &&
                        moment(hp.date).isValid() &&
                        typeof hp.price === 'number' && !isNaN(hp.price)
      })
    })

    test('getHistoricExchangeRates should return historic exchange rates series', async () => {
      const historicRates = await financialTimes.getHistoricExchangeRates('GBP', 'USD')
      expect(historicRates).toBeArray().not.toBeEmpty()
      expect(historicRates).toSatisfyAll(hr => {
        return hr instanceof Currency.HistoricRate &&
                        moment(hr.date).isValid() &&
                        typeof hr.rate === 'number' && !isNaN(hr.rate)
      })
    })

    describe('getHoldings', () => {
      test('should return holdings object', async () => {
        const holdings = await financialTimes.getHoldings('GB00B2NWD414')
        expect(holdings).toBeArray().not.toBeEmpty()
        expect(holdings).toSatisfyAll(h => {
          return typeof h.name === 'string' && h.name &&
                            typeof h.symbol === 'string' &&
                            typeof h.weight === 'number' && isFinite(h.weight)
        })
      })

      test('should return holdings object with fallback', async () => {
        const fallbackFund = Fund.builder('GB00B8JYLC77')
          .holdings([new Fund.Holding('NIHON M&A CENTER INC', null, 0.07)])
          .build()

        const holdings = await financialTimes.getHoldings('GB00B8JYLC77', fallbackFund)
        expect(holdings).toBeArray().not.toBeEmpty()
        expect(holdings).toSatisfyAll(h => {
          return typeof h.name === 'string' && h.name &&
                            typeof h.symbol === 'string' && h.symbol &&
                            typeof h.weight === 'number' && isFinite(h.weight)
        })
      })
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
      const fund = Fund.builder(isin)
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
      expect(realTimeDetails.holdings).toSatisfyAll((h) => h.currency && typeof h.currency === 'string' && h.currency.length === 3)
      expect(realTimeDetails.holdings).toSatisfyAll((h) => typeof h.todaysChange === 'number')
    })

    test('listCurrencies should return list of available currencies', async () => {
      const currencies = await financialTimes.listCurrencies()
      expect(currencies).toBeArray()
      expect(currencies).toIncludeAllMembers(['GBP', 'USD', 'CNY', 'EUR', 'BRL'])
    })

    test('getSymbolFromName should return symbol for fund name', async () => {
      const aia = await financialTimes.getSymbolFromName('AIA Group Ltd')
      expect(aia).toEqual({ symbol: '1299:HKG', name: 'AIA Group Ltd' })

      // drop the prefix
      const homeDepot = await financialTimes.getSymbolFromName('The Home Depot Inc')
      expect(homeDepot).toEqual({ symbol: 'HD:NYQ', name: 'Home Depot Inc' })

      // drop suffix
      const alphabet = await financialTimes.getSymbolFromName('Alphabet Inc Class C')
      expect(alphabet).toEqual({ symbol: 'GOOGL:NSQ', name: 'Alphabet Inc' })

      // hypen equivalence
      const franco = await financialTimes.getSymbolFromName('Franco Nevada Corp')
      expect(franco).toEqual({ symbol: 'FNV:TOR', name: 'Franco-Nevada Corp' })

      const notFound = await financialTimes.getSymbolFromName('Non existent fund name')
      expect(notFound).toEqual({ symbol: undefined, name: undefined })
    })
  })

  describe('Stream methods', function () {
    const version = 'v2'
    test('streamFundsFromIsins should return Transform stream outputting array of funds', (done) => {
      const isin1 = 'GB00B80QG615'
      const isin2 = 'GB00B80QFX11'
      const fund1 = Fund.builder(isin1).build()
      const fund2 = Fund.builder(isin2).build()

      jest.spyOn(financialTimes, 'getFundFromIsin')
        .mockImplementation(async fund => fund)

      const isinToFundStream = financialTimes.streamFundsFromIsins()
      StreamTest[version].fromObjects([fund1, fund2])
        .pipe(isinToFundStream)
        .pipe(StreamTest[version].toObjects((err, funds) => {
          expect(funds).toEqual([fund1, fund2])
          done(err)
        }))
    })
  })
})
