import Vue from 'vue'

export const addFund = (state, fund) => {
  // replace with new record
  state.loaded = [fund, ...state.loaded.filter(f => f.isin !== fund.isin)]
}

export const removeFund = (state, isin) => {
  state.loaded = state.loaded.filter(f => f.isin !== isin)
}

export const addRealTimeDetails = (state, {isin, fundRealTimeDetails}) => {
  Vue.set(state.realTimeDetails, isin, fundRealTimeDetails)
}

export const removeRealTimeDetails = (state, isin) => {
  Vue.delete(state.realTimeDetails, isin)
}

export const addJob = (state, {isin, jobId}) => {
  Vue.set(state.activeJobs, isin, jobId)
}

export const removeJob = (state, isin) => {
  Vue.delete(state.activeJobs, isin)
}

export const setSummary = (state, fundsSummary) => {
  state.summary = fundsSummary
}
