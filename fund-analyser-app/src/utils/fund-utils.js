export default {
  findClosestRecord (targetDate, historicPrices) {
    if (!historicPrices || !historicPrices.length) {
      return { date: undefined, price: undefined }
    }
    let low = 0
    let high = historicPrices.length - 1
    // binary search
    while (low + 1 < high) {
      const mid = Math.floor((low + high) / 2)
      const compareDate = historicPrices[mid].date
      const diff = Date.parse(compareDate) - targetDate
      if (diff === 0) {
        return historicPrices[mid]
      } else if (diff > 0) {
        high = mid
      } else {
        low = mid
      }
    }
    return Math.abs(Date.parse(historicPrices[low].date) - targetDate) <
            Math.abs(Date.parse(historicPrices[high].date) - targetDate)
      ? historicPrices[low]
      : historicPrices[high]
  }
}
