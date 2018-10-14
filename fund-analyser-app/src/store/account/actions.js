import accountService from './../../services/account-service'

export async function init ({ commit }) {
  try {
    const { balance, statement, watchlist } = await accountService.get()
    commit('saveBalance', balance)
    commit('saveStatement', statement)
    commit('setWatchlist', watchlist)
  } catch (ignored) {
    // user not signed in
  }
}

export async function getBalance ({ commit }) {
  const { balance } = await accountService.getBalance()
  commit('saveBalance', balance)
}

export async function getStatement ({ commit }) {
  const { statement } = await accountService.getStatement()
  commit('saveStatement', statement)
}

export async function getWatchlist ({ commit }) {
  try {
    const { watchlist } = await accountService.getWatchlist()
    commit('setWatchlist', watchlist)
  } catch (ignored) {
    // user not logged in
  }
}

export async function addToWatchlist ({ commit, state }, isin) {
  if (!state.watchlist.includes(isin)) {
    commit('setWatchlist', state.watchlist.concat([isin]))
  }
  try {
    await accountService.addToWatchlist(isin)
  } catch (ignored) {
    // user not logged in
  }
}

export async function removeFromWatchlist ({ commit, state }, isin) {
  if (state.watchlist.includes(isin)) {
    commit('setWatchlist', state.watchlist.filter(i => i !== isin))
  }
  try {
    await accountService.removeFromWatchlist(isin)
  } catch (ignored) {
    // user not logged in
  }
}

export async function clearWatchlist ({ commit }) {
  commit('setWatchlist', [])
  try {
    await accountService.clearWatchlist()
  } catch (ignored) {
    // user not logged in
  }
}

export async function addToRecentlyViewed ({ commit, state, getters }, { isin, name }) {
  if (!getters.recentlyViewedIsins.includes(isin)) {
    commit('setRecentlyViewed', state.recentlyViewed.concat([{ isin, name }]))
  }
}

export async function removeFromRecentlyViewed ({ commit, state, getters }, isin) {
  if (getters.recentlyViewedIsins.includes(isin)) {
    commit('setRecentlyViewed', state.recentlyViewed.filter(e => e.isin !== isin))
  }
}

export async function clearRecentlyViewed ({ commit }) {
  commit('setRecentlyViewed', [])
}
