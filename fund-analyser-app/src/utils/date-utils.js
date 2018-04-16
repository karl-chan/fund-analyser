import { date } from 'quasar'
import moment from 'moment'

const { startOfDate } = date

export default {
  startOfDay (date = new Date()) {
    return startOfDate(date, 'day')
  },
  isAfterNow (date) {
    if (!date) {
      return false
    }
    return moment(date).isAfter()
  }
}
