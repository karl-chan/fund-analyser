import accountService from '../services/account-service'
import adminService from '../services/admin-service'
import authService from '../services/auth-service'
import currencyService from '../services/currency-service'
import fundService from '../services/fund-service'
import simulateService from '../services/simulate-service'
import stockService from '../services/stock-service'

export default ({ app }) => {
  app.config.globalProperties.$services = {
    account: accountService,
    admin: adminService,
    auth: authService,
    currency: currencyService,
    fund: fundService,
    simulate: simulateService,
    stock: stockService
  }
}
