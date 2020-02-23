export function lookupFund (state) {
  return isin => state.loaded[isin]
}

export function lookupSimilarFund (state) {
  return isin => state.loadedSimilarFunds[isin]
}
