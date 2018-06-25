import apiService from './api-service'

export default {
  get (isin) {
    return apiService.get(`/funds/fund/${isin}`)
  },
  getRealTimeDetails (isin) {
    return apiService.get(`/funds/real-time-details/${isin}`)
  },
  getSummary () {
    return apiService.get('/funds/summary')
  },
  search (searchText) {
    return apiService.get(`/funds/search/${searchText}`)
  }
}
