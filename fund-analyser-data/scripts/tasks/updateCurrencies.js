module.exports = updateCurrencies

const FinancialTimes = require('../../lib/fund/FinancialTimes')
const Currency = require('../../lib/currency/Currency')
const CurrencyDAO = require('../../lib/db/CurrencyDAO')
const log = require('../../lib/util/log')
const Promise = require('bluebird')

/**
 * Update currency exchange rates
 * @returns {Promise.<void>}
 */
async function updateCurrencies () {
    const financialTimes = new FinancialTimes()
    const allCurrencies = await financialTimes.listCurrencies()
    log.info('Updating %d currencies: %j', allCurrencies.length, allCurrencies)

    const base = CurrencyDAO.HOME_CURRENCY
    const quoteCurrencies = allCurrencies.filter(c => c !== base)

    await Promise.map(
        quoteCurrencies,
        async quote => {
            const historicRates = await financialTimes.getHistoricExchangeRates(base, quote)
            const currency = new Currency(base, quote, historicRates)
            await CurrencyDAO.upsertCurrency(currency)
            log.info(`Upserted currency pair ${base}${quote}`)
        }
    )
};
