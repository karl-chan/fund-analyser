import accountService from '../services/account-service'
import adminService from '../services/admin-service'
import authService from '../services/auth-service'
import fundService from '../services/fund-service'

export default ({ Vue }) => {
  Vue.prototype.$services = {
    account: accountService,
    admin: adminService,
    auth: authService,
    fund: fundService
  }
}
