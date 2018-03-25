import format from '../utils/format-utils'
import number from '../utils/number-utils'
import fund from '../utils/fund-utils'

export default ({ Vue }) => {
  Vue.prototype.$utils = { format, number, fund }
}
