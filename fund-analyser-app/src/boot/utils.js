import account from '../utils/account-utils'
import currency from '../utils/currency-utils'
import date from '../utils/date-utils'
import format from '../utils/format-utils'
import fund from '../utils/fund-utils'
import number from '../utils/number-utils'
import router from '../utils/router-utils'
import timer from '../utils/timer-utils'

export default ({ app }) => {
  app.config.globalProperties.$utils = { account, currency, date, format, fund, number, router, timer }
}
