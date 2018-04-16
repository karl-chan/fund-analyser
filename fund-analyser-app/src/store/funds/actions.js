import { Platform } from 'quasar'
import fundService from './../../services/fund-service'
import dateUtils from './../../utils/date-utils'
import router from './../../router'

export async function init ({dispatch}) {
  // save bandwidth
  if (!Platform.is.mobile) {
    dispatch('getSummary')
  }
}

export async function get ({commit}, isin) {
  await fundService.get(isin)
    .then(fundService.setExpiry)
    .then(fund => commit('addFund', fund))
}

export async function lazyGet ({dispatch, getters}, isin) {
  const cachedFund = getters['lookupFund'](isin)
  if (cachedFund) {
    const upToDate = Date.parse(cachedFund.asof) >= dateUtils.startOfDay()
    if (upToDate) {
      return
    }
  }
  await dispatch('get', isin)
}

export async function getRealTimeDetails ({commit}, isin) {
  await fundService.getRealTimeDetails(isin).then(fundRealTimeDetails => {
    commit('addRealTimeDetails', { isin, fundRealTimeDetails })
  })
}

export function startRealTimeUpdates ({commit, dispatch, getters}, isin) {
  const minute = 60 * 1000
  const existingJob = getters.lookupActiveJob(isin)
  if (existingJob) {
    commit('incrementJobCounter', isin)
    return false
  } else {
    dispatch('getRealTimeDetails', isin)
    const jobId = setInterval(() => dispatch('getRealTimeDetails', isin), minute)
    commit('addJob', {isin, jobId})
    return true
  }
}

export function stopRealTimeUpdates ({state, commit, getters}, isin) {
  const existingJob = getters.lookupActiveJob(isin)
  if (existingJob && existingJob.count <= 1) {
    clearInterval(existingJob.jobId)
    commit('removeJob', isin)
    return true
  } else {
    commit('decrementJobCounter', isin)
    return false
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
