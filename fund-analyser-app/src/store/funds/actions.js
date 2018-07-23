import fundService from './../../services/fund-service'
import dateUtils from './../../utils/date-utils'
import router from './../../router'

export async function get ({commit}, isin) {
  const fund = await fundService.get(isin)
  commit('addFund', fund)
  return fund
}

export async function lazyGet ({dispatch, getters}, isin) {
  const cachedFund = getters['lookupFund'](isin)
  if (cachedFund) {
    const upToDate = !dateUtils.isBeforeToday(cachedFund.asof)
    if (upToDate) {
      return cachedFund
    }
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
