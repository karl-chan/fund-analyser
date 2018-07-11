export function lookupBalance (state) {
  return state.charlesStanleyDirect.balance
}

export function inWatchlist (state, isin) {
  return isin => state.watchlist.includes(isin)
}
