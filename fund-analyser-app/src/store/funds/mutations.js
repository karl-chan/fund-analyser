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

export function setRealTimeDetails (state, realTimeDetailsPairs) {
  for (let [isin, realTimeDetails] of realTimeDetailsPairs) {
    if (isin in state.loaded) {
      state.loaded[isin].realTimeDetails = realTimeDetails
    }
  }
}

export function setSummary (state, fundsSummary) {
  state.summary = fundsSummary
}
