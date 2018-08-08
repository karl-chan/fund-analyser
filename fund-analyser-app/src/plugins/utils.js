import account from '../utils/account-utils'
import date from '../utils/date-utils'
import format from '../utils/format-utils'
import fund from '../utils/fund-utils'
import number from '../utils/number-utils'
import router from '../utils/router-utils'
import timer from '../utils/timer-utils'

export default ({ Vue }) => {
  Vue.prototype.$utils = { account, date, format, fund, number, router, timer }
}
