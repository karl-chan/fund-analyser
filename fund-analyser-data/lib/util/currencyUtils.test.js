
const currencyUtils = require('./currencyUtils')
const Currency = require('../currency/Currency')

describe('currencyUtils', () => {
    let base, quote, currency
    beforeEach(() => {
        base = 'GBP'
        quote = 'USD'
        const historicRates = [
            new Currency.HistoricRate(new Date(2001, 0, 1), 1.26),
            new Currency.HistoricRate(new Date(2001, 0, 2), 1.27),
            new Currency.HistoricRate(new Date(2001, 0, 3), 1.28)
        ]
        const returns = currencyUtils.calculateReturns(historicRates)
        currency = new Currency(base, quote, historicRates, returns)
    })
    test('invertCurrency should invert currency pair', () => {
        const inverted = currencyUtils.invertCurrency(currency)
        expect(inverted).toBeInstanceOf(Currency)
        expect(inverted).toHaveProperty('base', quote)
        expect(inverted).toHaveProperty('quote', base)
        expect(inverted).toHaveProperty('historicRates', [
            new Currency.HistoricRate(new Date(2001, 0, 1), 1 / 1.26),
            new Currency.HistoricRate(new Date(2001, 0, 2), 1 / 1.27),
            new Currency.HistoricRate(new Date(2001, 0, 3), 1 / 1.28)
        ])
    })

    describe('multiplyCurrency', () => {
        test('multiplyCurrency should refuse to multiply for invalid pairs', () => {
            const currency2 = new Currency('GBP', 'HKD', [], {}) // currency1.quote !== currency2.base
            expect(() => currencyUtils.multiplyCurrencies(currency, currency2)).toThrowError()
        })
        test('multiplyCurrency should multiply and forward fill currency pairs', () => {
            const quote2 = 'HKD'
            const currency2 = new Currency(quote, quote2, [
                new Currency.HistoricRate(new Date(2000, 11, 31), 7.75),
                new Currency.HistoricRate(new Date(2001, 0, 2), 7.85),
                new Currency.HistoricRate(new Date(2001, 0, 4), 7.8)
            ], {})
            const multiplied = currencyUtils.multiplyCurrencies(currency, currency2)
            expect(multiplied).toHaveProperty('historicRates', [
                new Currency.HistoricRate(new Date(2000, 11, 31), 9.765),
                new Currency.HistoricRate(new Date(2001, 0, 1), 9.765),
                new Currency.HistoricRate(new Date(2001, 0, 2), 9.9695),
                new Currency.HistoricRate(new Date(2001, 0, 3), 10.048),
                new Currency.HistoricRate(new Date(2001, 0, 4), 9.984)
            ])
        })
    })

    test('calculateReturns', () => {
        expect(currency.returns['1D']).toBeCloseTo(0.0079, 4)
    })
})
