export function lookupFund (state) {
  return isin => state.loaded.find(f => f.isin === isin)
}

export function lookupRealTimeDetails (state) {
  return isin => state.realTimeDetails[isin]
}
