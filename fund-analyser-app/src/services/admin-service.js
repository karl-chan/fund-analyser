import apiService from './api-service'

export default {
  healthcheck () {
    return apiService.get('/admin/healthcheck')
  },
  getLogs (dyno) {
    return apiService.get(`/admin/logs/${dyno}`)
  },
  restartDyno (dyno) {
    return apiService.post(`/admin/restart/${dyno}`)
  }
}
