import { date } from 'quasar'

const { startOfDate } = date

export default {
  startOfDay (date = new Date()) {
    return startOfDate(date, 'day')
  }
}
