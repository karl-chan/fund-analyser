import fundService from './../../services/fund-service'
import dateUtils from './../../utils/date-utils'
import router from './../../router'

export async function get ({dispatch}, isin) {
  const funds = await dispatch('gets', [isin])
  return funds[0]
}

export async function gets ({dispatch, commit}, isins) {
  if (!isins || !isins.length) {
    return []
  }
  const funds = await fundService.gets(isins)
  commit('addFunds', funds)
  dispatch('updateRealTimeDetails')
  return funds
}

export async function lazyGet ({dispatch, getters}, isin) {
  const cachedFund = getters['lookupFund'](isin)
  if (cachedFund) {
    const upToDate = !dateUtils.isBeforeToday(cachedFund.asof)
    if (!upToDate) {
      dispatch('get', isin)
    }
    return cachedFund
  }
  return dispatch('get', isin)
}

export function remove ({commit, rootState}, isin) {
  commit('removeFund', isin)
  if (rootState.route.path.includes(isin)) {
    router.push({name: 'home'})
  }
}

export function removeAll ({commit, dispatch, state}) {
  commit('removeAllFunds')
  router.push({name: 'home'})
}

export async function getSummary ({commit}) {
  const summary = await fundService.getSummary()
  commit('setSummary', summary)
  return summary
}

export async function updateRealTimeDetails ({commit, state}) {
  const isins = Object.keys(state.loaded)
  const realTimeDetailsPairs = await fundService.getRealTimeDetails(isins)
  commit('setRealTimeDetails', realTimeDetailsPairs)
}
