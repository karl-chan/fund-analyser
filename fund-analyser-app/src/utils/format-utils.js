export default {
  formatPercentage (float, displaySymbol) {
    if (float === undefined || float === null) {
      return '-'
    }
    return (100 * float).toFixed(2) + (displaySymbol ? '%' : '')
  }
}
