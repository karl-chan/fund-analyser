import { colors } from 'quasar'
import moment from 'moment'

const { lighten } = colors
const [red, green] = ['#f44336', '#4caf50']

export default {
  colourNumber (float) {
    return float > 0 ? 'text-green' : (float < 0 ? 'text-red' : undefined)
  },

  colourNumberCell (float) {
    return {
      'background-color': float > 0
        ? lighten(green, 100 * (1 - float))
        : (float < 0
          ? lighten(red, 100 * (1 + float))
          : null),
      color: 'black'
    }
  },

  fallbackDisplay (fallbackValue) {
    return fallbackValue == null ? '-' : fallbackValue
  },

  formatString (s, fallbackValue) {
    if (s == null) {
      return this.fallbackDisplay(this.fallbackValue)
    }
    return s
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
    const format = withDashes ? 'YYYY-MM-DD' : 'YYYYMMDD'
    return this.formatDate(date, format, fallbackValue)
  },

  formatDateLong (date, fallbackValue) {
    return this.formatDate(date, 'dddd, DD MMM YYYY', fallbackValue)
  },

  formatDate (date, pattern, fallbackValue) {
    const d = moment(date)
    if (!d.isValid()) {
      return this.fallbackDisplay(fallbackValue)
    }
    return d.format(pattern)
  },

  formatFromNow (date, fallbackValue) {
    const d = moment(date)
    if (!d.isValid()) {
      return this.fallbackDisplay(fallbackValue)
    }
    return d.fromNow()
  }
}
