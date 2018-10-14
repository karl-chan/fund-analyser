export default {
  findClosestRecord (targetDate, historicPrices) {
    if (!historicPrices || !historicPrices.length) {
      return { date: undefined, price: undefined }
    }
    let low = 0
    let high = historicPrices.length - 1
    // binary search
    while (low < high) {
      const mid = Math.floor((low + high) / 2)
      const compareDate = historicPrices[mid].date
      const diff = Date.parse(compareDate) - targetDate
      if (diff === 0) {
        return historicPrices[mid]
      } else if (diff > 0) {
        high = mid - 1
      } else {
        low = mid + 1
      }
    }
    return historicPrices[low]
  }
}
