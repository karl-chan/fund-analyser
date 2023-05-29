import Fund from './Fund'

describe('Fund', function () {
  let isin: string, name: string, type: any, shareClass: any, frequency: string, ocf: number, amc: number, entryCharge: number, exitCharge: number,
    bidAskSpread: number, holdings: Fund.Holding[], historicPrices: Fund.HistoricPrice[], returns: Fund.Returns, asof: Date, indicators: Fund.Indicators, realTimeDetails: Fund.RealTimeDetails
  let fund: Fund

  beforeEach(() => {
    isin = 'GB00B80QG615'
    name = 'HSBC American Index Fund Accumulation C'
    type = Fund.types.OEIC
    shareClass = Fund.shareClasses.ACC
    frequency = 'Daily'
    ocf = 0.0006
    amc = NaN
    entryCharge = 0
    exitCharge = 0
    bidAskSpread = NaN
    holdings = [new Fund.Holding('Apple Inc', 'AAPL:NSQ', 0.0407)]
    historicPrices = [new Fund.HistoricPrice(new Date(2015, 8, 9), 3.198), new Fund.HistoricPrice(new Date(2015, 8, 10), 3.149)]
    returns = { '5Y': 0.1767, '3Y': 0.226 }
    asof = new Date(2018, 8, 8)
    indicators = { stability: { value: 1.96 } }
    realTimeDetails = { estChange: -0.00123, estPrice: 3.198, stdev: 0.01, ci: [3.197, 3.199], holdings: [], lastUpdated: undefined }

    fund = new Fund(isin, name, type, shareClass, frequency, ocf, amc, entryCharge, exitCharge,
      bidAskSpread, holdings, historicPrices, returns, asof, indicators, realTimeDetails)
  })
  test('constructor should populate Fund with correct fields', () => {
    expect(fund).toMatchObject({ isin, name, type, shareClass, frequency, ocf, amc, entryCharge, exitCharge, bidAskSpread, holdings, historicPrices, returns, asof, indicators, realTimeDetails })
  })

  test('isValid should return true for fund with name', () => {
    expect(fund.isValid()).toBeTrue()
  })
  test('isValid should return false for fund without name', () => {
    const undefinedNameFund = new Fund(isin, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, [], [], {}, undefined, undefined, undefined)
    const nullNameFund = new Fund(isin, null, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, [], [], {}, undefined, undefined, undefined)
    const emptyNameFund = new Fund(isin, '', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, [], [], {}, undefined, undefined, undefined)
    expect([undefinedNameFund, nullNameFund, emptyNameFund]).toSatisfyAll(f => !f.isValid())
  })

  describe('Builder', () => {
    test('build should bulid Fund object', () => {
      const builder = Fund.builder(isin)
        .name(name)
        .type(type)
        .shareClass(shareClass)
        .frequency(frequency)
        .ocf(ocf)
        .amc(amc)
        .entryCharge(entryCharge)
        .exitCharge(exitCharge)
        .bidAskSpread(bidAskSpread)
        .holdings(holdings)
        .historicPrices(historicPrices)
        .returns(returns)
        .asof(asof)
        .indicators(indicators)
        .realTimeDetails(realTimeDetails)
      const actual = builder.build()
      expect(actual).toBeInstanceOf(Fund)
      expect(actual).toEqual(fund)
    })
  })
})
