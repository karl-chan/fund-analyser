import apiService from './api-service'

export default {
  simulate (simulateParam) {
    return apiService.post('/simulate', { simulateParam })
  },
  predict (simulateParam, date) {
    return apiService.post('/simulate/predict', { simulateParam, date })
  },
  getSupportedStrategies () {
    return apiService.get('/simulate/strategies')
  }
}
