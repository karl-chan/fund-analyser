import router from './../router'

export default {
  redirectToHome () {
    router.push({name: 'home'})
  },
  redirectToLogin () {
    router.push({name: 'login'})
  },
  redirectToLogout () {
    router.push({name: 'logout'})
  },
  redirectToFund (isin) {
    router.push({ name: 'fund', params: { isin } })
  }
}
