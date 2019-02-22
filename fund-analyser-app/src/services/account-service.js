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
  addToCurrencies (currency) {
    return apiService.post('/account/currency/add', { currency })
  },
  removeFromCurrencies (currency) {
    return apiService.post('/account/currency/remove', { currency })
  }
}
