const Fund = require('./Fund.js')

describe('Fund', function () {
    let fund1, fund2
    beforeEach(function () {
        fund1 = Fund.Builder('test')
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
            .build()
        fund2 = Fund.Builder('test')
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
            .build()
    })
    test('equals should return true for equal Fund objects', function () {
        expect(fund1.equals(fund2)).toBeTruthy()
    })
    test('equals should return false for different fund name', function () {
        fund2.name = 'Different'
        expect(fund1.equals(fund2)).toBeFalsy()
    })
    test('equals should return false for different share classes', function () {
        fund2.shareClass = Fund.shareClasses.INC
        expect(fund1.equals(fund2)).toBeFalsy()
    })
    test('equals should return false for different pricing frequencies', function () {
        fund2.frequency = 'Weekly'
        expect(fund1.equals(fund2)).toBeFalsy()
    })
    test('equals should return false for different ongoing fund charge', function () {
        fund2.ocf = 0
        expect(fund1.equals(fund2)).toBeFalsy()
    })
    test('equals should return false for different annual management charge', function () {
        fund2.amc = 0
        expect(fund1.equals(fund2)).toBeFalsy()
    })
    test('equals should return false for different entry charge', function () {
        fund2.entryCharge = NaN
        expect(fund1.equals(fund2)).toBeFalsy()
    })
    test('equals should return false for different exit charge', function () {
        fund2.exitCharge = NaN
        expect(fund1.equals(fund2)).toBeFalsy()
    })
    test('equals should return false for different holdings', function () {
        fund2.holdings = [new Fund.Holding('Different Holding', 'TEST', 0)]
        expect(fund1.equals(fund2)).toBeFalsy()
    })
    test('equals should return false for different historic prices', function () {
        fund2.historicPrices = [new Fund.HistoricPrice(new Date(2001, 1, 1), 457.0)]
        expect(fund1.equals(fund2)).toBeFalsy()
    })
    test('equals should return false for different returns', function () {
        fund2.returns = {'5Y': 0.5, '3Y': -0.2, '1Y': 0.3, '6M': 0.4, '3M': 0, '1M': 0}
        expect(fund1.equals(fund2)).toBeFalsy()
    })
})
