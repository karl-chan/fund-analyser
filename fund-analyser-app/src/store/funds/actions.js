import fundService from './../../services/fund-service'
import dateUtils from './../../utils/date-utils'
import router from './../../router'
import fromPairs from 'lodash/fromPairs'

import moment from 'moment'

const REAL_TIME_DETAILS_REFRESH_INTERVAL = moment.duration(1, 'minute')

export async function get ({dispatch}, isin) {
  const funds = await dispatch('gets', [isin])
  return funds[0]
}

export async function gets ({dispatch, commit, state}, isins) {
  if (!isins || !isins.length) {
    return []
  }
  const funds = await fundService.gets(isins)
  dispatch('add', funds)
  return funds
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

export function add ({commit, dispatch}, funds) {
  commit('addFunds', funds)
  dispatch('startRealTimeUpdates', funds.map(f => f.isin))
}

export function remove ({commit, rootState}, isin) {
  commit('removeActiveJob', isin)
  commit('removeFund', isin)
  if (rootState.route.path.includes(isin)) {
    router.push({name: 'home'})
  }
}

export function removeAll ({commit, dispatch, state}) {
  commit('removeAllActiveJobs')
  commit('removeAllFunds')
  router.push({name: 'home'})
}

export async function getSummary ({commit}) {
  const summary = await fundService.getSummary()
  commit('setSummary', summary)
  return summary
}

export async function startRealTimeUpdates ({commit, dispatch, state}, isins) {
  const newJobsArr = isins
    .filter(isin => !(isin in state.activeJobs))
    .map(isin => {
      dispatch('updateRealTimeDetails', isin)
      const job = setInterval(() => dispatch('updateRealTimeDetails', isin), REAL_TIME_DETAILS_REFRESH_INTERVAL.asMilliseconds())
      return [isin, job]
    })
  const newJobs = fromPairs(newJobsArr)
  commit('addActiveJobs', newJobs)
}

export async function updateRealTimeDetails ({commit}, isin) {
  const realTimeDetails = await fundService.getRealTimeDetails(isin)
  commit('setRealTimeDetails', {isin, realTimeDetails})
}
