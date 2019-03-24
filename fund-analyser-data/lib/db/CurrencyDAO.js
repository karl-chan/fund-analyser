
const db = require('../util/db')
const currencyUtils = require('../util/currencyUtils')
const _ = require('lodash')

const HOME_CURRENCY = 'GBP'

/**
 * List all currencies in baseQuotePairs
 * @param currencyPairs array of <base><quote> strings, e.g. ["GBPUSD", "GBPBRL", "HKDCNY", ...]
 * @returns array of currencies, e.g. [
 *      {base: "GBP", quote: "USD", historicRates: [...]},
 *      {base: "GBP", quote: "BRL", historicRates: [...]}
 * ]
 */
async function listCurrencies (currencyPairs) {
    if (!currencyPairs || !currencyPairs.length) {
        return []
    }

    const baseQuotePairs = currencyPairs.map(pair => {
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
    const currenciesByQuote = _.keyBy(rawCurrencies, c => c.quote)

    const currencies = []
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

async function upsertCurrency (currency) {
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
async function listSupportedCurrencies () {
    const projection = { _id: 0, base: 1, quote: 1 }
    const baseQuotes = await db.getCurrencies().find({}, { projection }).toArray()
    return _.uniq(_.flatten(baseQuotes.map(pair => [pair.base, pair.quote])))
}

async function listSupportedReturns () {
    const projection = { _id: 0, base: 1, quote: 1, returns: 1 }
    return db.getCurrencies().find({}, { projection }).toArray()
}

function fromCurrency (currency) {
    return _.toPlainObject(currency)
}

module.exports = {
    listCurrencies,
    listSupportedCurrencies,
    listSupportedReturns,
    upsertCurrency,
    HOME_CURRENCY
}
