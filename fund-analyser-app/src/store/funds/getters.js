export function numLoadedFunds (state) {
  return Object.keys(state.loaded).length
}

export function lookupFund (state) {
  return isin => state.loaded[isin]
}

export function lookupRealTimeDetails (state) {
  return isin => state.realTimeDetails[isin]
}

export function lookupActiveJob (state) {
  return isin => state.activeJobs[isin]
}
