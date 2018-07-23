export function lookupFund (state) {
  return isin => state.loaded[isin]
}
