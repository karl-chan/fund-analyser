import Vue from 'vue'

export function addFund (state, fund) {
  Vue.set(state.loaded, fund.isin, fund)
}

export function removeFund (state, isin) {
  Vue.delete(state.loaded, isin)
}

export function removeAllFunds (state) {
  state.loaded = {}
}

export function addRealTimeDetails (state, {isin, fundRealTimeDetails}) {
  Vue.set(state.realTimeDetails, isin, fundRealTimeDetails)
}

export function removeRealTimeDetails (state, isin) {
  Vue.delete(state.realTimeDetails, isin)
}

export function addJob (state, {isin, jobId}) {
  Vue.set(state.activeJobs, isin, {jobId, count: 1})
}

export function removeJob (state, isin) {
  Vue.delete(state.activeJobs, isin)
}

export function incrementJobCounter (state, isin) {
  const existingJob = state.activeJobs[isin]
  Vue.set(existingJob, 'count', existingJob.count + 1)
}

export function decrementJobCounter (state, isin) {
  const existingJob = state.activeJobs[isin]
  Vue.set(existingJob, 'count', existingJob.count - 1)
}

export function setSummary (state, fundsSummary) {
  state.summary = fundsSummary
}
