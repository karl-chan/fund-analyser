import moment from 'moment-business-days'

export default {
  startOfDay (date = new Date()) {
    const mdate = this.verifyDate(date)
    return mdate && mdate.startOf('day')
  },
  isAfterNow (date) {
    const mdate = this.verifyDate(date)
    return mdate && mdate.isAfter()
  },
  isBeforeToday (date) {
    const mdate = this.verifyDate(date)
    return mdate && mdate.isBefore(this.startOfDay())
  },
  diffBusinessDays (a, b) {
    return this.startOfDay(a).businessDiff(this.startOfDay(b))
  },
  verifyDate (date) {
    if (!date) {
      return false
    }
    const mdate = moment(date)
    if (!mdate.isValid()) {
      return false
    }
    return mdate
  }
}
