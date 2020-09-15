import apiService from './api-service'

export default {
  gets (symbol) {
    return apiService.get(`/stocks/symbols/${symbol.join(',')}`)
  },
  getSummary () {
    return apiService.get('/stocks/summary')
  },
  search (searchText) {
    return apiService.get(`/stocks/search/${searchText}`)
  },
  list (symbol, params) {
    return apiService.post('/stocks/list', { symbol, params })
  },
  getIndicatorSchema () {
    return apiService.get('/stocks/indicators')
  }
}
