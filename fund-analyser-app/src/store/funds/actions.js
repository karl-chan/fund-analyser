import fundService from './../../services/fund-service'
import dateUtils from './../../utils/date-utils'
import router from './../../router'
import partition from 'lodash/partition'

export async function gets ({ dispatch, commit }, isins) {
  if (!isins || !isins.length) {
    return []
  }
  const funds = await fundService.gets(isins)
  commit('addFunds', funds)
  dispatch('updateRealTimeDetails', isins)
  return funds
}

export async function lazyGets ({ dispatch, getters }, isins) {
  if (!isins || !isins.length) {
    return []
  }
  const [loadedIsins, outdatedIsins] = partition(isins, isin => {
    const cachedFund = getters['lookupFund'](isin)
    return cachedFund && !dateUtils.isBeforeToday(cachedFund.asof)
  })
  const cachedFunds = loadedIsins.map(isin => getters['lookupFund'](isin))
  const newFunds = await dispatch('gets', outdatedIsins)
  return [...cachedFunds, ...newFunds]
}

export function remove ({ commit, rootState }, isin) {
  commit('removeFund', isin)
  if (rootState.route.path.includes(isin)) {
    router.push({ name: 'home' })
  }
}

export function removeAll ({ commit, dispatch, state }) {
  commit('removeAllFunds')
  router.push({ name: 'home' })
}

export async function getSummary ({ commit }) {
  const summary = await fundService.getSummary()
  commit('setSummary', summary)
  return summary
}

export async function updateRealTimeDetails ({ commit, state }, isins) {
  if (!isins) {
    isins = Object.keys(state.loaded)
  }
  const realTimeDetailsPairs = await fundService.getRealTimeDetails(isins)
  commit('setRealTimeDetails', realTimeDetailsPairs)
}
