import Vue from 'vue'

export function addFund (state, fund) {
  // replace with new record
  state.loaded = [fund, ...state.loaded.filter(f => f.isin !== fund.isin)]
}

export function removeFund (state, isin) {
  state.loaded = state.loaded.filter(f => f.isin !== isin)
}

export function addRealTimeDetails (state, {isin, fundRealTimeDetails}) {
  Vue.set(state.realTimeDetails, isin, fundRealTimeDetails)
}

export function removeRealTimeDetails (state, isin) {
  Vue.delete(state.realTimeDetails, isin)
}

export function addJob (state, {isin, jobId}) {
  Vue.set(state.activeJobs, isin, jobId)
}

export function removeJob (state, isin) {
  Vue.delete(state.activeJobs, isin)
}

export function setSummary (state, fundsSummary) {
  state.summary = fundsSummary
}
