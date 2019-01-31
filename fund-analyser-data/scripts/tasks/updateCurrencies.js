module.exports = updateCurrencies

const FinancialTimes = require('../../lib/fund/FinancialTimes')
const Currency = require('../../lib/currency/Currency')
const CurrencyDAO = require('../../lib/db/CurrencyDAO')
const currencyUtils = require('../../lib/util/currencyUtils')
const log = require('../../lib/util/log')
const properties = require('../../lib/util/properties')
const Promise = require('bluebird')

const lookbacks = properties.get('fund.lookbacks')

/**
 * Update currency exchange rates
 * @returns {Promise.<void>}
 */
async function updateCurrencies () {
    const financialTimes = new FinancialTimes()
    const allCurrencies = await financialTimes.listCurrencies()
    log.info('Updating %d currencies: %j', allCurrencies.length, allCurrencies)

    // add returns
    for (let currency of allCurrencies) {
        currency.returns = currencyUtils.calculateReturns(currency, lookbacks)
    }

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
