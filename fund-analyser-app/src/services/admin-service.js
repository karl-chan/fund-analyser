import apiService from './api-service'

export default {
  healthcheck () {
    return apiService.get('/admin/healthcheck')
  },
  getLogs (category, lines) {
    return apiService.get(
      lines
        ? `/admin/logs/${category}?lines=${lines}`
        : `/admin/logs/${category}`)
  },
  restartDyno (category) {
    return apiService.post(`/admin/restart/${category}`)
  },
  getTestReport () {
    return apiService.get('/admin/test-report')
  }
}
