import apiService from './api-service'

export default {
  getBalance (token) {
    return apiService.get('/account/get/balance')
  }
}
