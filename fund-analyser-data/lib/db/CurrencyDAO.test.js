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
        const currencies = await CurrencyDAO.listCurrencies(['GBPUSD', 'GBPBRL', 'HKDCNY'])
        expect(currencies).toBeArrayOfSize(3).toSatisfyAll(c => c.historicRates.length > 0)
        expect(currencies.map(c => c.base + c.quote)).toIncludeSameMembers(['GBPUSD', 'GBPBRL', 'HKDCNY'])
    })
    test('listSupportedCurrencies should return array of currenciess', async () => {
        const currencyPairs = await CurrencyDAO.listSupportedCurrencies()
        expect(currencyPairs).toBeArray().not.toBeEmpty()
        expect(currencyPairs).toSatisfyAll(currency => typeof currency === 'string' &&
                                                            currency.length === 3 &&
                                                            currency === currency.toUpperCase())
    })
})
