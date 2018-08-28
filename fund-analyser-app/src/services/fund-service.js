import apiService from './api-service'

export default {
  gets (isins) {
    return apiService.get(`/funds/isins/${isins.join(',')}`)
  },
  getRealTimeDetails (isin) {
    return apiService.get(`/funds/real-time-details/${isin}`)
  },
  getSummary () {
    return apiService.get('/funds/summary')
  },
  search (searchText) {
    return apiService.get(`/funds/search/${searchText}`)
  },
  list (isins, params) {
    return apiService.post('/funds/list', {isins, params})
  }
}
