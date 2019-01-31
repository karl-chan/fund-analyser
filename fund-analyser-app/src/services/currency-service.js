import apiService from './api-service'

export default {
  getSupportedCurrencies () {
    return apiService.get('/currency/list/supported')
  },
  list (currencyPairs) {
    return apiService.get('currency/list', { params: { pairs: currencyPairs.join(',') } })
  }
}
