import Vue from 'vue'

export function saveCsdBalance (state, balance) {
  Vue.set(state.charlesStanleyDirect, 'balance', balance)
}

export function setWatchlist (state, watchlist) {
  state.watchlist = watchlist
}

export function setRecentlyViewed (state, recentlyViewed) {
  state.recentlyViewed = recentlyViewed
}

export function reset (state) {
  state.charlesStanleyDirect = {balance: null}
  state.watchlist = []
  state.recentlyViewed = []
}
