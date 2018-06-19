import moment from 'moment-business-days'

export default {
  startOfDay (date = new Date()) {
    return moment(date).startOf('day')
  },
  isAfterNow (date) {
    if (!date) {
      return false
    }
    return moment(date).isAfter()
  },
  isBeforeToday (date) {
    if (!date) {
      return false
    }
    return moment(date).isBefore(this.startOfDay())
  },
  diffBusinessDays (a, b) {
    return this.startOfDay(a).businessDiff(this.startOfDay(b))
  }
}
