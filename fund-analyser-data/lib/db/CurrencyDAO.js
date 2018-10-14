
const db = require('../util/db')
const Currency = require('../currency/Currency')
const currencyUtils = require('../util/currencyUtils')
const _ = require('lodash')

const HOME_CURRENCY = 'GBP'

/**
 * List all currencies in baseQuotePairs
 * @param currencyPairs array of <base><quote> strings, e.g. ["GBPUSD", "GBPBRL", "HKDCNY", ...]
 * @return js object, e.g. {
 *      "GBP": {
 *          "USD": [...],
 *          "BRL": [...]
 *      },
 *      "HKD": {
 *          "CNY": [...]
 *      }
 *  }
 */
async function listCurrencies (currencyPairs) {
    const baseQuotePairs = currencyPairs.map(pair => {
        const base = pair.substring(0, 3)
        const quote = pair.substring(3, 6)
        return [base, quote]
    })

    const requiredQuoteCurrencies = _.uniq(_.flatten(baseQuotePairs)).filter(c => c !== HOME_CURRENCY)
    const query = {
        quote: { $in: requiredQuoteCurrencies }
    }
    const currencies = await db.getCurrencies().find(query).toArray()
    const currenciesByQuote = _.keyBy(currencies, c => c.quote)

    const currencyMap = {}
    baseQuotePairs.forEach(([base, quote]) => {
        const path = `${base}.${quote}`
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
        _.set(currencyMap, path, toCurrency(currency))
    })
    return currencyMap
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

function fromCurrency (currency) {
    return _.toPlainObject(currency)
}

function toCurrency (entry) {
    return new Currency(
        entry.base,
        entry.quote,
        entry.historicRates.map(hr => new Currency.HistoricRate(hr.date, hr.rate))
    )
}

module.exports = {
    listCurrencies,
    upsertCurrency,
    HOME_CURRENCY
}
