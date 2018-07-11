export function numLoadedFunds (state) {
  return Object.keys(state.loaded).length
}

export function lookupFund (state) {
  return isin => state.loaded[isin]
}
