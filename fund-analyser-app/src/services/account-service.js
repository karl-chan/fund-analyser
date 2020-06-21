import apiService from './api-service'

export default {
  get () {
    return apiService.get('/account')
  },
  getBalance () {
    return apiService.get('/account/balance')
  },
  getOrders () {
    return apiService.get('/account/orders')
  },
  getStatement () {
    return apiService.get('/account/statement')
  },
  getFundWatchlist () {
    return apiService.get('/account/fund-watchlist')
  },
  addToFundWatchlist (isin) {
    return apiService.post('/account/fund-watchlist/add', { isin })
  },
  removeFromFundWatchlist (isin) {
    return apiService.post('/account/fund-watchlist/remove', { isin })
  },
  clearFundWatchlist () {
    return apiService.delete('/account/fund-watchlist')
  },
  addToFavouriteCurrencies (currency) {
    return apiService.post('/account/currency/add', { currency })
  },
  removeFromFavouriteCurrencies (currency) {
    return apiService.post('/account/currency/remove', { currency })
  },
  getFavouriteSimulateParams () {
    return apiService.get('/account/simulate-params')
  },
  addToFavouriteSimulateParams (simulateParam) {
    return apiService.post('/account/simulate-params/add', { simulateParam })
  },
  removeFromFavouriteSimulateParams (simulateParam) {
    return apiService.post('/account/simulate-params/remove', { simulateParam })
  },
  updateFavouriteSimulateParams (simulateParam, { active }) {
    return apiService.post('/account/simulate-params/update', { simulateParam, active })
  }
}
