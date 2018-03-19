import { Platform } from 'quasar'
import fundService from './../../services/fund-service'
import router from './../../router'

export function init ({dispatch}) {
  if (!Platform.is.mobile) {
    dispatch('summary')
  }
  // otherwise lazily load summary to save mobile data bandwidth
}

export function get ({commit}, isin) {
  fundService.get(isin).then(fund => {
    commit('addFund', fund)
  })
}

export function getRealTimeDetails ({commit}, isin) {
  fundService.getRealTimeDetails(isin).then(fundRealTimeDetails => {
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

export const summary = ({commit}) => {
  fundService.summary().then(fundsSummary => commit('setSummary', fundsSummary))
}
