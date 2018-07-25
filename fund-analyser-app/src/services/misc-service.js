import apiService from './api-service'

export default {
  healthcheck () {
    return apiService.get('/healthcheck')
  }
}
