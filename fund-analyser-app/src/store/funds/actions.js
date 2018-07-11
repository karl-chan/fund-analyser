import fundService from './../../services/fund-service'
import dateUtils from './../../utils/date-utils'
import router from './../../router'

export async function get ({commit}, isin) {
  await fundService.get(isin)
    .then(fundService.setExpiry)
    .then(fund => commit('addFund', fund))
}

export async function lazyGet ({dispatch, getters}, isin) {
  const cachedFund = getters['lookupFund'](isin)
  if (cachedFund) {
    const upToDate = !dateUtils.isBeforeToday(cachedFund.asof)
    if (upToDate) {
      return
    }
  }
  await dispatch('get', isin)
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
  await fundService.getSummary()
    .then(fundsSummary => commit('setSummary', fundsSummary))
}
