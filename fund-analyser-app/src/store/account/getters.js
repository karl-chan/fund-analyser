export function inWatchlist (state, isin) {
  return isin => state.watchlist.includes(isin)
}
