import apiService from './api-service'

export default {
  getSupportedCurrencies () {
    return apiService.get('/currency/supported')
  },
  getSummary () {
    return apiService.get('/currency/summary', { params: { invert: true } })
  },
  list (currencyPairs) {
    return apiService.get('/currency/get', { params: { pairs: currencyPairs.join(',') } })
  }
}
