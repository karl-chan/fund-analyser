import currencyService from './../../services/currency-service'
import last from 'lodash/last'
import dateUtils from './../../utils/date-utils'

export async function init ({ dispatch }) {
  dispatch('getSupportedCurrencies')
}

export async function getSupportedCurrencies ({ commit }) {
  const symbols = await currencyService.getSupportedCurrencies()
  commit('setSupportedCurrencies', symbols)
}

export async function lazyGets ({ state, commit }, currencyPairs) {
  if (!currencyPairs) {
    return []
  }
  const outdatedPairs = currencyPairs.filter(pair => {
    const currency = state.loaded[pair]
    return !currency || !currency.historicRates ||
            dateUtils.isBeforeToday(last(currency.historicRates).date)
  })

  const currencies = await currencyService.list(outdatedPairs)
  commit('addCurrencies', currencies)
}
