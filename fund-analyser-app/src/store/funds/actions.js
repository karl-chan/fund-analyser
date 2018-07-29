import fundService from './../../services/fund-service'
import router from './../../router'

export async function get ({dispatch}, isin) {
  const funds = await dispatch('gets', [isin])
  return funds[0]
}

export async function gets ({commit}, isins) {
  if (!isins || !isins.length) {
    return []
  }
  const funds = await fundService.gets(isins)
  commit('addFunds', funds)
  return funds
}

export async function lazyGet ({dispatch, getters}, isin) {
  const fundPromise = dispatch('get', isin)
  const cachedFund = getters['lookupFund'](isin)
  return cachedFund || fundPromise
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
