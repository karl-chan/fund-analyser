export default {
  colorNumber (float) {
    return {
      'text-green': float > 0,
      'text-red': float < 0
    }
  },

  formatPercentage (float, displaySymbol) {
    if (float === undefined || float === null) {
      return '-'
    }
    return (100 * float).toFixed(2) + (displaySymbol ? '%' : '')
  }
}
