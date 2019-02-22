export function saveBalance (state, balance) {
  state.balance = balance
}

export function saveOrders (state, orders) {
  state.orders = orders
}

export function saveStatement (state, statement) {
  state.statement = statement
}

export function setWatchlist (state, watchlist) {
  state.watchlist = watchlist
}

export function setRecentlyViewed (state, recentlyViewed) {
  state.recentlyViewed = recentlyViewed
}

export function setCurrencies (state, currencies) {
  state.currencies = currencies
}

export function reset (state) {
  state.balance = null
  state.orders = []
  state.statement = null
  state.watchlist = []
  state.recentlyViewed = []
}
