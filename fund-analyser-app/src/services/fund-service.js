import apiService from './api-service'

export default {
  get (isin) {
    return apiService.get(`/funds/get/${isin}`)
  },
  getRealTimeDetails (isin) {
    return apiService.get(`/funds/get/real-time-details/${isin}`)
  },
  getSummary () {
    return apiService.get('/funds/summary')
  },
  search (searchText) {
    return apiService.get(`/funds/search/${searchText}`)
  }
}
