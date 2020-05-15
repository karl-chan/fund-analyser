const Fund = require('./Fund')

describe('Fund', function () {
    let isin, sedol, name, type, shareClass, frequency, ocf, amc, entryCharge, exitCharge,
        bidAskSpread, holdings, historicPrices, returns, asof, indicators, realTimeDetails
    let fund

    beforeEach(() => {
        isin = 'GB00B80QG615'
        sedol = 'B80QG61'
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
        indicators = { stability: 1.96 }
        realTimeDetails = { estChange: -0.00123 }

        fund = new Fund(isin, sedol, name, type, shareClass, frequency, ocf, amc, entryCharge, exitCharge,
            bidAskSpread, holdings, historicPrices, returns, asof, indicators, realTimeDetails)
    })
    test('constructor should populate Fund with correct fields', () => {
        expect(fund).toMatchObject({ isin, sedol, name, type, shareClass, frequency, ocf, amc, entryCharge, exitCharge, bidAskSpread, holdings, historicPrices, returns, asof, indicators, realTimeDetails })
    })

    test('isValid should return true for fund with name', () => {
        expect(fund.isValid()).toBeTrue()
    })
    test('isValid should return false for fund without name', () => {
        const undefinedNameFund = new Fund(isin, sedol, undefined)
        const nullNameFund = new Fund(isin, sedol, null)
        const emptyNameFund = new Fund(isin, sedol, '')
        expect([undefinedNameFund, nullNameFund, emptyNameFund]).toSatisfyAll(f => !f.isValid())
    })

    describe('Builder', () => {
        test('build should bulid Fund object', () => {
            const builder = Fund.Builder(isin)
                .sedol(sedol)
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
