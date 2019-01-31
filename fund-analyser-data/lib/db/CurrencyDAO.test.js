const CurrencyDAO = require('./CurrencyDAO')
const Currency = require('../currency/Currency')
const db = require('../util/db')

jest.setTimeout(30000) // 30 seconds

describe('CurrencyDAO', function () {
    beforeAll(async () => {
        await db.init()
    })
    afterAll(async () => {
        await db.close()
    })
    test('listCurrencies should return object map of currencies', async () => {
        const currencyMap = await CurrencyDAO.listCurrencies(['GBPUSD', 'GBPBRL', 'HKDCNY'])
        expect(currencyMap['GBP']['USD']).toBeInstanceOf(Currency)
        expect(currencyMap['GBP']['BRL']).toBeInstanceOf(Currency)
        expect(currencyMap['HKD']['CNY']).toBeInstanceOf(Currency)
        expect(currencyMap['GBP']['USD'].historicRates).toBeArray().not.toBeEmpty()
        expect(currencyMap['GBP']['BRL'].historicRates).toBeArray().not.toBeEmpty()
        expect(currencyMap['HKD']['CNY'].historicRates).toBeArray().not.toBeEmpty()
    })
    test('listSupportedCurrencies should return array of currenciess', async () => {
        const currencyPairs = await CurrencyDAO.listSupportedCurrencies()
        expect(currencyPairs).toBeArray().not.toBeEmpty()
        expect(currencyPairs).toSatisfyAll(currency => typeof currency === 'string' &&
                                                            currency.length === 3 &&
                                                            currency === currency.toUpperCase())
    })
})
