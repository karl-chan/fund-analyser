import * as _ from 'lodash'
import Currency from '../currency/Currency'
import * as currencyUtils from '../util/currencyUtils'
import * as db from '../util/db'

export const HOME_CURRENCY = 'GBP'

/**
 * List all currencies in baseQuotePairs
 * @param currencyPairs array of <base><quote> strings, e.g. ["GBPUSD", "GBPBRL", "HKDCNY", ...]
 * @returns array of currencies, e.g. [
 *      {base: "GBP", quote: "USD", historicRates: [...]},
 *      {base: "GBP", quote: "BRL", historicRates: [...]}
 * ]
 */
export async function listCurrencies (currencyPairs: string[]) {
  if (!currencyPairs || !currencyPairs.length) {
    return []
  }

  const baseQuotePairs = currencyPairs.map((pair: string) => {
    const base = pair.substring(0, 3)
    const quote = pair.substring(3, 6)
    return [base, quote]
  })

  const requiredQuoteCurrencies = _.uniq(_.flatten(baseQuotePairs)).filter(c => c !== HOME_CURRENCY)
  const query = {
    quote: { $in: requiredQuoteCurrencies }
  }
  const projection = { _id: 0 }
  const rawCurrencies = await db.getCurrencies().find(query, { projection }).toArray()
  const parsedCurrencies = rawCurrencies.map(({
    base,
    quote,
    historicRates,
    returns
  }) => new Currency(base, quote, historicRates, returns))
  const currenciesByQuote = _.keyBy(parsedCurrencies, c => c.quote)

  const currencies: Currency[] = []
  baseQuotePairs.forEach(([base, quote]) => {
    let currency
    if (base === quote) {
      return
    } else if (base === HOME_CURRENCY) {
      if (!(quote in currenciesByQuote)) {
        return
      }
      currency = currenciesByQuote[quote]
    } else if (quote === HOME_CURRENCY) {
      if (!(base in currenciesByQuote)) {
        return
      }
      currency = currencyUtils.invertCurrency(currenciesByQuote[base])
    } else {
      if (!(base in currenciesByQuote) || !(quote in currenciesByQuote)) {
        return
      }
      currency = currencyUtils.multiplyCurrencies(
        currencyUtils.invertCurrency(currenciesByQuote[base]),
        currenciesByQuote[quote]
      )
    }
    currencies.push(currency)
  })
  return currencies
}

export async function upsertCurrency (currency: Currency) {
  const query = {
    base: currency.base,
    quote: currency.quote
  }
  const doc = fromCurrency(currency)
  const res = await db.getCurrencies().replaceOne(query, doc, { upsert: true })
  return res
}

/**
 * Returns supported currencies.
 * @returns [string] e.g. ['GBP', 'USD', ...]
 */
export async function listSupportedCurrencies () {
  const projection = { _id: 0, base: 1, quote: 1 }
  const baseQuotes = await db.getCurrencies().find({}, { projection }).toArray()
  return _.uniq(_.flatten(baseQuotes.map(pair => [pair.base, pair.quote])))
}

export async function listSummary () {
  const defaultHistoricRates: Currency.HistoricRate[] = [] // fill with empty array
  const projection = { _id: 0, base: 1, quote: 1, returns: 1 }
  const rawCurrencies = await db.getCurrencies().find({}, { projection }).toArray()
  return rawCurrencies.map(({
    base,
    quote,
    returns
  }) => new Currency(base, quote, defaultHistoricRates, returns))
}

function fromCurrency (currency: Currency) {
  return _.toPlainObject(currency)
}
