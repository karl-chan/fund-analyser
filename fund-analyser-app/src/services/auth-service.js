import apiService from './api-service'

export default {
  getAuth () {
    return apiService.get('/auth/get')
  },

  login (user, pass, memorableWord, persist) {
    return apiService.post('/auth/login', { user, pass, memorableWord, persist })
  },

  logout (user) {
    return apiService.post('/auth/logout')
  }

}
