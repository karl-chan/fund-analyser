module.exports = updateCurrencies

const FinancialTimes = require('../../lib/fund/FinancialTimes')
const Currency = require('../../lib/currency/Currency')
const CurrencyDAO = require('../../lib/db/CurrencyDAO')
const log = require('../../lib/util/log')

/**
 * Update currency exchange rates
 * @returns {Promise.<void>}
 */
async function updateCurrencies () {
    const financialTimes = new FinancialTimes()
    const allCurrencies = await financialTimes.listCurrencies()

    const base = CurrencyDAO.HOME_CURRENCY
    const quoteCurrencies = allCurrencies.filter(c => c !== base)

    await Promise.all(
        quoteCurrencies.map(async quote => {
            const historicRates = await new Promise((resolve, reject) => {
                financialTimes.getHistoricExchangeRates(base, quote, (err, rates) => {
                    err ? reject(err) : resolve(rates)
                })
            })
            const currency = new Currency(base, quote, historicRates)
            await CurrencyDAO.upsertCurrency(currency)
            log.info(`Upserted currency pair ${base}${quote}`)
        })
    )
};
