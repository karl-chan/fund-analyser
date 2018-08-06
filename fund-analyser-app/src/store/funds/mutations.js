import Vue from 'vue'
import keyBy from 'lodash/keyBy'

export function addFunds (state, funds) {
  const isinsToFunds = keyBy(funds, f => f.isin)
  state.loaded = {...state.loaded, ...isinsToFunds}
}

export function removeFund (state, isin) {
  Vue.delete(state.loaded, isin)
}

export function removeAllFunds (state) {
  state.loaded = {}
}

export function setRealTimeDetails (state, {isin, realTimeDetails}) {
  if (isin in state.loaded) {
    state.loaded[isin].realTimeDetails = realTimeDetails
  }
}

export function setSummary (state, fundsSummary) {
  state.summary = fundsSummary
}

export function addActiveJobs (state, activeJobs) {
  state.activeJobs = {...state.activeJobs, ...activeJobs}
}

export function removeActiveJob (state, isin) {
  if (isin in state.activeJobs) {
    clearInterval(state.activeJobs[isin])
  }
}

export function removeAllActiveJobs (state) {
  Object.values(state.activeJobs).forEach(clearInterval)
}
