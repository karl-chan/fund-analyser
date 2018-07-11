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

export function setSummary (state, fundsSummary) {
  state.summary = fundsSummary
}
