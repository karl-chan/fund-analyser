import fundService from './../../services/fund-service'
import router from './../../router'

export async function get ({commit}, isin) {
  await fundService.get(isin)
    .then(fundService.setExpiry)
    .then(fund => commit('addFund', fund))
}

export async function lazyGet ({dispatch, getters}, isin) {
  const cachedFund = getters['lookupFund'](isin)
  if (!cachedFund) {
    await dispatch('get', isin)
  }
}

export async function getRealTimeDetails ({commit}, isin) {
  await fundService.getRealTimeDetails(isin).then(fundRealTimeDetails => {
    commit('addRealTimeDetails', { isin, fundRealTimeDetails })
  })
}

export function startRealTimeUpdates ({commit, dispatch}, isin) {
  const minute = 60 * 1000
  dispatch('getRealTimeDetails', isin)
  const jobId = setInterval(() => dispatch('getRealTimeDetails', isin), minute)
  commit('addJob', {isin, jobId})
}

export function stopRealTimeUpdates ({state, commit}, isin) {
  const jobId = state.activeJobs[isin]
  if (jobId) {
    clearInterval(jobId)
    commit('removeJob', isin)
  }
}

export function remove ({commit, rootState}, isin) {
  commit('removeFund', isin)
  commit('removeRealTimeDetails', isin)
  this.dispatch('stopRealTimeUpdates')
  if (rootState.route.path.includes(isin)) {
    router.push({name: 'home'})
  }
}

export function removeAll ({commit, dispatch, state}) {
  commit('removeAllFunds')
  for (let isin of Object.keys(state.activeJobs)) {
    dispatch('stopRealTimeUpdates', isin)
  }
  router.push({name: 'home'})
}

export async function getSummary ({commit}) {
  await fundService.getSummary()
    .then(fundsSummary => commit('setSummary', fundsSummary))
}
