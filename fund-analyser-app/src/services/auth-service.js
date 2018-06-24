import apiService from './api-service'

export default {
  login (user, pass, memorableWord, persist) {
    return apiService.post('/auth/login', { user, pass, memorableWord, persist })
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
    return apiService.delete('/auth/session', { params: {encryptedId} })
  }
}
