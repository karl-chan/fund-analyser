import { Dialog, Notify } from 'quasar'
import accountService from './../../services/account-service'

export async function init ({ commit }) {
  try {
    const { balance, statement, watchlist, currencies } = await accountService.get()
    commit('saveBalance', balance)
    commit('saveStatement', statement)
    commit('setWatchlist', watchlist)
    commit('setCurrencies', currencies)
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

export async function removeFromWatchlist ({ commit, dispatch, state }, isin) {
  const confirm = await promptClearWatchlist(false)
  if (!confirm) {
    return
  }
  if (state.watchlist.includes(isin)) {
    commit('setWatchlist', state.watchlist.filter(i => i !== isin))
  }
  try {
    await accountService.removeFromWatchlist(isin)
  } catch (ignored) {
    // user not logged in
  }
}

export async function clearWatchlist ({ commit, dispatch }) {
  const confirm = await promptClearWatchlist(true)
  if (!confirm) {
    return
  }
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

export async function addToCurrencies ({ commit, state }, symbol) {
  if (!state.currencies.includes(symbol)) {
    commit('setCurrencies', state.currencies.concat([symbol]))
  }
  try {
    await accountService.addToCurrencies(symbol)
  } catch (ignored) {
    // user not logged in
  }
}

export async function removeFromCurrencies ({ commit, state }, symbol) {
  if (state.currencies.includes(symbol)) {
    commit('setCurrencies', state.currencies.filter(c => c !== symbol))
  }
  try {
    await accountService.removeFromCurrencies(symbol)
  } catch (ignored) {
    // user not logged in
  }
}

async function promptClearWatchlist (all) {
  try {
    await Dialog.create({
      title: all ? 'Clear watchlist?' : 'Remove from watchlist?',
      message: 'This will remove the watchlist associated with your account. This action is irreversible!',
      ok: {
        color: 'negative',
        label: 'Proceed'
      },
      cancel: {
        color: 'positive',
        label: 'Cancel'
      }
    })
    return true
  } catch (ignored) {
    // user cancelled operation
    await Notify.create({ message: 'Action cancelled', type: 'positive' })
    return false
  }
}
