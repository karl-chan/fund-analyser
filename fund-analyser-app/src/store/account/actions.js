import isEqual from 'lodash/isEqual'
import { Dialog, Notify } from 'quasar'
import accountService from './../../services/account-service'

export async function init ({ commit }) {
  try {
    const { balance, orders, statement, watchlist, currencies, simulateParams } = await accountService.get()
    commit('saveBalance', balance)
    commit('saveOrders', orders)
    commit('saveStatement', statement)
    commit('setWatchlist', watchlist)
    commit('setFavouriteCurrencies', currencies)
    commit('setFavouriteSimulateParams', simulateParams)
  } catch (ignored) {
    // user not signed in
  }
}

export async function getBalance ({ commit }) {
  const { balance } = await accountService.getBalance()
  commit('saveBalance', balance)
}

export async function getOrders ({ commit }) {
  const { orders } = await accountService.getOrders()
  commit('saveOrders', orders)
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

export async function addToFavouriteCurrencies ({ commit, state }, symbol) {
  if (!state.favouriteCurrencies.includes(symbol)) {
    commit('setFavouriteCurrencies', state.favouriteCurrencies.concat([symbol]))
  }
  try {
    await accountService.addToFavouriteCurrencies(symbol)
  } catch (ignored) {
    // user not logged in
  }
}

export async function removeFromFavouriteCurrencies ({ commit, state }, symbol) {
  if (state.favouriteCurrencies.includes(symbol)) {
    commit('setFavouriteCurrencies', state.favouriteCurrencies.filter(c => c !== symbol))
  }
  try {
    await accountService.removeFromFavouriteCurrencies(symbol)
  } catch (ignored) {
    // user not logged in
  }
}

export async function addToFavouriteSimulateParams ({ commit, state, getters }, simulateParam) {
  if (!getters.inFavouriteSimulateParams(simulateParam)) {
    commit('setFavouriteSimulateParams', state.favouriteSimulateParams.concat([simulateParam]))
  }
  try {
    await accountService.addToFavouriteSimulateParams(simulateParam)
  } catch (ignored) {
    // user not logged in
  }
}

export async function removeFromFavouriteSimulateParams ({ commit, state, getters }, simulateParam) {
  const confirm = await promptClearFavouriteSimulateParams(false)
  if (!confirm) {
    return
  }
  if (getters.inFavouriteSimulateParams(simulateParam)) {
    commit('setFavouriteSimulateParams', state.favouriteSimulateParams.filter(param => !isEqual(param, simulateParam)))
  }
  try {
    await accountService.removeFromFavouriteSimulateParams(simulateParam)
  } catch (ignored) {
    // user not logged in
  }
}

async function promptClearWatchlist (all) {
  const title = all ? 'Clear watchlist?' : 'Remove from watchlist?'
  const message = 'This will remove the watchlist associated with your account. This action is irreversible!'
  return promptClear({ title, message })
}

async function promptClearFavouriteSimulateParams (all) {
  const title = all ? 'Clear simulations?' : 'Remove simulation?'
  const message = 'This will remove the simulation associated with your account. This action is irreversible!'
  return promptClear({ title, message })
}

async function promptClear ({ title, message }) {
  return new Promise((resolve) => {
    Dialog.create({
      title,
      message,
      persistent: true,
      ok: {
        color: 'negative',
        label: 'Proceed'
      },
      cancel: {
        color: 'positive',
        label: 'Cancel'
      }
    })
      .onOk(() => resolve(true))
      .onCancel(() => {
        Notify.create('Action cancelled')
        resolve(false)
      })
  })
}
