import date from '../utils/date-utils'
import format from '../utils/format-utils'
import fund from '../utils/fund-utils'
import number from '../utils/number-utils'
import router from '../utils/router-utils'

export default ({ Vue }) => {
  Vue.prototype.$utils = { date, format, fund, number, router }
}
