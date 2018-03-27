import { date } from 'quasar'

const { startOfDate } = date

export default {
  startOfDay (date) {
    return startOfDate(date, 'day')
  }
}
