import { date } from 'quasar'

const { formatDate } = date

export default {
  colourNumber (float) {
    return float > 0 ? 'text-green' : (float < 0 ? 'text-red' : undefined)
  },

  fallbackDisplay (fallbackValue) {
    return fallbackValue == null ? '-' : fallbackValue
  },

  formatNumber (float, fallbackValue) {
    if (float == null) {
      return this.fallbackDisplay(fallbackValue)
    }
    return (float).toFixed(2)
  },

  formatPercentage (float, displaySymbol, fallbackValue) {
    if (float == null) {
      return this.fallbackDisplay(fallbackValue)
    }
    return this.formatNumber(100 * float) + (displaySymbol ? '%' : '')
  },

  formatDateShort (date, withDashes, fallbackValue) {
    if (date == null) {
      return this.fallbackDisplay(fallbackValue)
    }
    const format = withDashes ? 'YYYY-MM-DD' : 'YYYYMMDD'
    return formatDate(date, format)
  },

  formatDateLong (date, fallbackValue) {
    if (date == null) {
      return this.fallbackDisplay(fallbackValue)
    }
    return formatDate(date, 'dddd, DD MMM YYYY')
  }
}
