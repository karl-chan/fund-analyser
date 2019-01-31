export default {
  findClosestRecord (targetDate, historicRates) {
    if (!historicRates || !historicRates.length) {
      return { date: undefined, rate: undefined }
    }
    let low = 0
    let high = historicRates.length - 1
    // binary search
    while (low + 1 < high) {
      const mid = Math.floor((low + high) / 2)
      const compareDate = historicRates[mid].date
      const diff = Date.parse(compareDate) - targetDate
      if (diff === 0) {
        return historicRates[mid]
      } else if (diff > 0) {
        high = mid
      } else {
        low = mid
      }
    }
    return Math.abs(Date.parse(historicRates[low].date) - targetDate) <
            Math.abs(Date.parse(historicRates[high].date) - targetDate)
      ? historicRates[low]
      : historicRates[high]
  }
}
