import apiService from './api-service'

export default {
  healthcheck () {
    return apiService.get('/admin/healthcheck')
  },
  getLogs (dyno, lines) {
    return apiService.get(
      lines
        ? `/admin/logs/${dyno}?lines=${lines}`
        : `/admin/logs/${dyno}`)
  },
  restartDyno (dyno) {
    return apiService.post(`/admin/restart/${dyno}`)
  }
}
