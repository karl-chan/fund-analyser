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
  getWatchlist () {
    return apiService.get('/account/watchlist')
  },
  addToWatchlist (isin) {
    return apiService.post('/account/watchlist/add', { isin })
  },
  removeFromWatchlist (isin) {
    return apiService.post('/account/watchlist/remove', { isin })
  },
  clearWatchlist () {
    return apiService.delete('/account/watchlist')
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
  }
}
