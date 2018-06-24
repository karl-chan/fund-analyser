import apiService from './api-service'

export default {
  getBalance () {
    return apiService.get('/account/balance')
  },
  getWatchlist () {
    return apiService.get('account/watchlist')
  },
  addToWatchlist (isin) {
    return apiService.post('/account/watchlist/add', {isin})
  },
  removeFromWatchlist (isin) {
    return apiService.post('/account/watchlist/remove', {isin})
  },
  clearWatchlist () {
    return apiService.delete('/account/watchlist')
  }
}
