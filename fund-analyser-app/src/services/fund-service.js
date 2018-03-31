import apiService from './api-service'

const GET_ENDPOINT = '/get'
const SUMMARY_ENDPOINT = '/summary'
const SEARCH_ENDPOINT = '/search'
const REAL_TIME_DETAILS_ENDPOINT = '/get/real-time-details'

const FUNDS_ENDPOINT = '/funds'

const apiFundsGet = (url) => apiService.get(FUNDS_ENDPOINT + url)

export default {
  get (isin) {
    return apiFundsGet(`${GET_ENDPOINT}/${isin}`)
  },
  getRealTimeDetails (isin) {
    return apiFundsGet(`${REAL_TIME_DETAILS_ENDPOINT}/${isin}`)
  },
  getSummary () {
    return apiFundsGet(SUMMARY_ENDPOINT)
  },
  search (searchText) {
    return apiFundsGet(`${SEARCH_ENDPOINT}/${searchText}`)
  }
}
