import format from '../utils/format-utils'
import number from '../utils/number-utils'

export default ({ Vue }) => {
  Vue.prototype.$utils = { format, number }
}
