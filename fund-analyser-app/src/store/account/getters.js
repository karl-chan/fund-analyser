export function inWatchlist (state) {
  return isin => state.watchlist.includes(isin)
}

export function recentlyViewedIsins (state) {
  return state.recentlyViewed.map(e => e.isin)
}
