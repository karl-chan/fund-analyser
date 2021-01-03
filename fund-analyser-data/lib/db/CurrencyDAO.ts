import Currency from '../currency/Currency'
import * as db from '../util/db'
import * as currencyUtils from '../util/currencyUtils'
import * as _ from 'lodash'

export const HOME_CURRENCY = 'GBP'

/**
 * List all currencies in baseQuotePairs
 * @param currencyPairs array of <base><quote> strings, e.g. ["GBPUSD", "GBPBRL", "HKDCNY", ...]
 * @returns array of currencies, e.g. [
 *      {base: "GBP", quote: "USD", historicRates: [...]},
 *      {base: "GBP", quote: "BRL", historicRates: [...]}
 * ]
 */
export async function listCurrencies (currencyPairs: any) {
  if (!currencyPairs || !currencyPairs.length) {
    return []
  }

  const baseQuotePairs = currencyPairs.map((pair: any) => {
    const base = pair.substring(0, 3)
    const quote = pair.substring(3, 6)
    return [base, quote]
  })

  const requiredQuoteCurrencies = _.uniq(_.flatten(baseQuotePairs)).filter((c: any) => c !== HOME_CURRENCY)
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
  }: any) => new Currency(base, quote, historicRates, returns))
  const currenciesByQuote = _.keyBy(parsedCurrencies, (c: any) => c.quote)

  const currencies: any = []
  // @ts-expect-error ts-migrate(7031) FIXME: Binding element 'base' implicitly has an 'any' typ... Remove this comment to see the full error message
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

export async function upsertCurrency (currency: any) {
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
  return _.uniq(_.flatten(baseQuotes.map((pair: any) => [pair.base, pair.quote])))
}

export async function listSummary () {
  const defaultHistoricRates: any = [] // fill with empty array
  const projection = { _id: 0, base: 1, quote: 1, returns: 1 }
  const rawCurrencies = await db.getCurrencies().find({}, { projection }).toArray()
  return rawCurrencies.map(({
    base,
    quote,
    returns
  }: any) => new Currency(base, quote, defaultHistoricRates, returns))
}

function fromCurrency (currency: any) {
  return _.toPlainObject(currency)
}
