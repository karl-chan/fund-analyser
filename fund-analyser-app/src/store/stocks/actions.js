import partition from 'lodash/partition'
import router from './../../router'
import stockService from './../../services/stock-service'
import dateUtils from './../../utils/date-utils'

export async function init ({ commit }) {
  const indicatorSchema = await stockService.getIndicatorSchema()
  commit('setIndicatorSchema', indicatorSchema)
}

export async function gets ({ dispatch, commit }, symbols) {
  if (!symbols || !symbols.length) {
    return []
  }
  const stocks = await stockService.gets(symbols)
  commit('addStocks', stocks)
  dispatch('updateRealTimeDetails', symbols)
  return stocks
}

export async function lazyGets ({ dispatch, getters }, symbols) {
  if (!symbols || !symbols.length) {
    return []
  }
  const [loadedStocks, outdatedStocks] = partition(symbols, stock => {
    const cachedStock = getters.lookupStock(stock)
    return cachedStock && !dateUtils.isBeforeToday(cachedStock.asof)
  })
  const cachedStocks = loadedStocks.map(stock => getters.lookupStock(stock))
  const newStocks = await dispatch('gets', outdatedStocks)
  return [...cachedStocks, ...newStocks]
}

export function remove ({ commit, rootState }, symbol) {
  commit('removeStock', symbol)
  if (rootState.route.path.includes(symbol)) {
    router.push({ name: 'home' })
  }
}

export function removeAll ({ commit, dispatch, state }) {
  commit('removeAllStocks')
  router.push({ name: 'home' })
}

export async function getSummary ({ commit }) {
  const summary = await stockService.getSummary()
  commit('setSummary', summary)
  return summary
}

export async function updateRealTimeDetails ({ commit, state }, symbols) {
  if (!symbols) {
    symbols = Object.keys(state.loaded)
  }
  const realTimeDetailsPairs = await stockService.getRealTimeDetails(symbols)
  commit('setRealTimeDetails', realTimeDetailsPairs)
}
