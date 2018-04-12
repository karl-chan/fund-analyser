export default {
  getIsins (balance) {
    if (balance && balance.holdings) {
      return balance.holdings.map(h => h.ISIN)
    }
    return []
  }
}
