import accountService from './../../services/account-service'

export async function init ({dispatch}) {
  await Promise.all([
    dispatch('getBalance'),
    dispatch('getWatchlist')
  ])
}

export async function getBalance ({commit, dispatch}) {
  const {balance} = await accountService.getBalance()
  commit('saveCsdBalance', balance)
}

export async function getWatchlist ({commit}) {
  try {
    const {watchlist} = await accountService.getWatchlist()
    commit('setWatchlist', watchlist)
  } catch (ignored) {
    // user not logged in
  }
}

export async function addToWatchlist ({commit, state}, isin) {
  if (!state.watchlist.includes(isin)) {
    commit('setWatchlist', state.watchlist.concat([isin]))
  }
  try {
    await accountService.addToWatchlist(isin)
  } catch (ignored) {
    // user not logged in
  }
}

export async function removeFromWatchlist ({commit, state}, isin) {
  if (state.watchlist.includes(isin)) {
    commit('setWatchlist', state.watchlist.filter(i => i !== isin))
  }
  try {
    await accountService.removeFromWatchlist(isin)
  } catch (ignored) {
    // user not logged in
  }
}

export async function clearWatchlist ({commit, state}, isin) {
  commit('setWatchlist', [])
  try {
    await accountService.clearWatchlist()
  } catch (ignored) {
    // user not logged in
  }
}
