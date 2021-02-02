import apiService from './api-service'

export default {
  gets (symbol) {
    return apiService.get(`/stocks/symbols/${symbol.join(',')}`)
  },
  getRealTimeDetails (symbols) {
    return apiService.get(`/stocks/real-time-details/${symbols.join(',')}`)
  },
  getSummary () {
    return apiService.get('/stocks/summary')
  },
  search (searchText) {
    return apiService.get(`/stocks/search/${searchText}`)
  },
  list (symbols, params) {
    return apiService.post('/stocks/list', { symbols, params })
  },
  getIndicatorSchema () {
    return apiService.get('/stocks/indicators')
  }
}
