import isEqual from 'lodash/isEqual'
import { Dialog, Notify } from 'quasar'
import accountService from './../../services/account-service'

export async function init ({ commit }) {
  try {
    const { balance, orders, statement, fundWatchlist, stockWatchlist, currencies, simulateParams } = await accountService.get()
    commit('saveBalance', balance)
    commit('saveOrders', orders)
    commit('saveStatement', statement)
    commit('setFundWatchlist', fundWatchlist)
    commit('setStockWatchlist', stockWatchlist)
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

export async function getFundWatchlist ({ commit }) {
  try {
    const { fundWatchlist } = await accountService.getFundWatchlist()
    commit('setFundWatchlist', fundWatchlist)
  } catch (ignored) {
    // user not logged in
  }
}

export async function addToFundWatchlist ({ commit, state }, isin) {
  if (!state.fundWatchlist.includes(isin)) {
    commit('setFundWatchlist', state.fundWatchlist.concat([isin]))
  }
  try {
    await accountService.addToFundWatchlist(isin)
  } catch (ignored) {
    // user not logged in
  }
}

export async function removeFromFundWatchlist ({ commit, dispatch, state }, isin) {
  const confirm = await promptClearWatchlist(false)
  if (!confirm) {
    return
  }
  if (state.fundWatchlist.includes(isin)) {
    commit('setFundWatchlist', state.fundWatchlist.filter(i => i !== isin))
  }
  try {
    await accountService.removeFromFundWatchlist(isin)
  } catch (ignored) {
    // user not logged in
  }
}

export async function clearFundWatchlist ({ commit, dispatch }) {
  const confirm = await promptClearWatchlist(true)
  if (!confirm) {
    return
  }
  commit('setFundWatchlist', [])
  try {
    await accountService.clearFundWatchlist()
  } catch (ignored) {
    // user not logged in
  }
}

export async function addToRecentlyViewedFunds ({ commit, state, getters }, { isin, name }) {
  if (!getters.recentlyViewedIsins.includes(isin)) {
    commit('setRecentlyViewedFunds', state.recentlyViewedFunds.concat([{ isin, name }]))
  }
}

export async function removeFromRecentlyViewedFunds ({ commit, state, getters }, isin) {
  if (getters.recentlyViewedIsins.includes(isin)) {
    commit('setRecentlyViewedFunds', state.recentlyViewedFunds.filter(e => e.isin !== isin))
  }
}

export async function clearRecentlyViewedFunds ({ commit }) {
  commit('setRecentlyViewedFunds', [])
}


export async function getStockWatchlist ({ commit }) {
  try {
    const { stockWatchlist } = await accountService.getStockWatchlist()
    commit('setStockWatchlist', stockWatchlist)
  } catch (ignored) {
    // user not logged in
  }
}

export async function addToStockWatchlist ({ commit, state }, isin) {
  if (!state.stockWatchlist.includes(isin)) {
    commit('setStockWatchlist', state.stockWatchlist.concat([isin]))
  }
  try {
    await accountService.addToStockWatchlist(isin)
  } catch (ignored) {
    // user not logged in
  }
}

export async function removeFromStockWatchlist ({ commit, dispatch, state }, isin) {
  const confirm = await promptClearWatchlist(false)
  if (!confirm) {
    return
  }
  if (state.stockWatchlist.includes(isin)) {
    commit('setStockWatchlist', state.stockWatchlist.filter(i => i !== isin))
  }
  try {
    await accountService.removeFromStockWatchlist(isin)
  } catch (ignored) {
    // user not logged in
  }
}

export async function clearStockWatchlist ({ commit, dispatch }) {
  const confirm = await promptClearWatchlist(true)
  if (!confirm) {
    return
  }
  commit('setStockWatchlist', [])
  try {
    await accountService.clearStockWatchlist()
  } catch (ignored) {
    // user not logged in
  }
}

export async function addToRecentlyViewedStocks ({ commit, state, getters }, { symbol, name }) {
  if (!getters.recentlyViewedSymbols.includes(symbol)) {
    commit('setRecentlyViewedStocks', state.recentlyViewedStocks.concat([{ symbol, name }]))
  }
}

export async function removeFromRecentlyViewedStocks ({ commit, state, getters }, symbol) {
  if (getters.recentlyViewedSymbols.includes(symbol)) {
    commit('setRecentlyViewedStocks', state.recentlyViewedStocks.filter(e => e.symbol !== symbol))
  }
}

export async function clearRecentlyViewedStocks ({ commit }) {
  commit('setRecentlyViewedStocks', [])
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

export async function getFavouriteSimulateParams ({ commit }) {
  const { simulateParams } = await accountService.getFavouriteSimulateParams()
  commit('setFavouriteSimulateParams', simulateParams)
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

export async function updateFavouriteSimulateParams ({ dispatch }, { simulateParam, active }) {
  try {
    if (!active) {
      const confirm = await promptClear({
        title: 'Stop trading?',
        message: 'This will deactivate algo trading. You can re-activate it by clicking on the lightning icon of the appropriate strategy.'
      })
      if (!confirm) {
        return
      }
    }
    await accountService.updateFavouriteSimulateParams(simulateParam, { active })
    await dispatch('getFavouriteSimulateParams')
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
