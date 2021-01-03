import { Promise } from 'bluebird'
import FinancialTimes from '../../lib/fund/FinancialTimes'
import Currency from '../../lib/currency/Currency'
import * as CurrencyDAO from '../../lib/db/CurrencyDAO'
import * as currencyUtils from '../../lib/util/currencyUtils'
import log from '../../lib/util/log'
/**
 * Update currency exchange rates
 * @returns {Promise.<void>}
 */
export default async function updateCurrencies () {
  const financialTimes = new FinancialTimes()
  const allCurrencies = await financialTimes.listCurrencies()
  log.info('Updating %d currencies: %j', allCurrencies.length, allCurrencies)
  const base = CurrencyDAO.HOME_CURRENCY
  const quoteCurrencies = allCurrencies.filter((c: any) => c !== base)
  await (Promise as any).map(quoteCurrencies, async (quote: any) => {
    const historicRates = await financialTimes.getHistoricExchangeRates(base, quote)
    const returns = currencyUtils.calcReturns(historicRates)
    const currency = new Currency(base, quote, historicRates, returns)
    await CurrencyDAO.upsertCurrency(currency)
    log.info(`Upserted currency pair ${base}${quote}`)
  })
}
