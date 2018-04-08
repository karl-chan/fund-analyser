import accountService from '../services/account-service'
import authService from '../services/auth-service'
import fundService from '../services/fund-service'

export default ({ Vue }) => {
  Vue.prototype.$services = { accountService, authService, fundService }
}
