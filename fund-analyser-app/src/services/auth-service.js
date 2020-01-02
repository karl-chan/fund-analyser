import apiService from './api-service'

export default {
  login (user, pass, memorableWord, persist, pushSubscription) {
    return apiService.post('/auth/login', { user, pass, memorableWord, persist, pushSubscription })
  },
  logout () {
    return apiService.post('/auth/logout')
  },
  getAuth () {
    return apiService.get('/auth')
  },
  getSessions () {
    return apiService.get('/auth/sessions')
  },
  destroySession (encryptedId) {
    return apiService.delete('/auth/session', { params: { encryptedId } })
  },
  getPushDetails () {
    return apiService.get('/auth/push')
  },
  pushNotifications () {
    return apiService.post('/auth/push')
  },
  subscribe (pushSubscription) {
    return apiService.post('/auth/push/subscribe', { pushSubscription })
  }
}
