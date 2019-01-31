<template lang="pug">
    .column.gutter-y-sm
      .q-headline Currency Dashboard
        .row.justify-between.items-center.gutter-x-md
          // user search bar
          q-search.shadow-2(v-model="currenciesFilter" placeholder="Filter currency (e.g. GBPUSD)" color="grey-2" inverted-light clearable upper-case)
            q-autocomplete(@search="search" @selected="onSelectCurrency")

      // grid of currencies
      .row(v-for="y in rows")
        .col.relative-position(v-for="x in cols")
          div(v-show="withinBounds(x, y)")
            currency-chart.chart(:currency="getCurrencyAt(x, y)")
            q-btn.close-btn(round push icon="close" size="lg" color="secondary" @click="removeCurrency(x, y)")
      template(v-if="!rows")
        .row.justify-center
          div Start by searching a currency

</template>

<script>
import { mapState, mapActions } from 'vuex'
import flatten from 'lodash/flatten'
import isEqual from 'lodash/isEqual'
import at from 'lodash/at'
export default {
  name: 'CurrencyDashboard',
  data: function () {
    return {
      currenciesFilter: '',
      cols: 3
    }
  },
  computed: {
    ...mapState('currency', ['supportedCurrencies', 'loaded']),
    ...mapState('account', ['currencies']),
    rows: function () {
      return Math.ceil(this.loadedCurrencies.length / this.cols)
    },
    supportedCurrencyPairs () {
      return flatten(this.supportedCurrencies
        .map(c1 =>
          this.supportedCurrencies.map(c2 => ({ base: c1, quote: c2 }))
        ))
        .filter(pair => pair.base !== pair.quote)
        .map(pair => pair.base + pair.quote)
    },
    loadedCurrencies () {
      return at(this.loaded, this.currencies).filter(c => c) // remove undefined's
    }
  },
  methods: {
    ...mapActions('currency', ['lazyGets']),
    ...mapActions('account', ['addToCurrencies', 'removeFromCurrencies']),
    onSelectCurrency ({ value }) {
      this.currenciesFilter = value
      // watch below - skip lazyGets
      this.addToCurrencies(value)
    },
    search (terms, done) {
      const matches = this.supportedCurrencyPairs
        .filter(pair => pair.includes(terms))
        .map(pair => {
          return {
            value: pair,
            label: pair.split(terms).join(`<b style="color:green">${terms}</b>`)
          }
        })
      done(matches)
    },
    // x, y start from 1, not 0
    indexAt (x, y) {
      return (y - 1) * this.cols + (x - 1)
    },
    withinBounds (x, y) {
      return this.indexAt(x, y) < this.loadedCurrencies.length
    },
    getCurrencyAt (x, y) {
      return this.loadedCurrencies[this.indexAt(x, y)]
    },
    removeCurrency (x, y) {
      const currency = this.getCurrencyAt(x, y)
      if (currency) {
        const symbol = `${currency.base}${currency.quote}`
        this.removeFromCurrencies(symbol)
      }
    }
  },
  watch: {
    currencies: {
      immediate: true,
      handler (newCurrencies, oldCurrencies) {
        if (newCurrencies && !isEqual(newCurrencies, oldCurrencies)) {
          this.lazyGets(newCurrencies)
        }
      }
    }
  }
}
</script>

<style lang="stylus">
.close-btn
  position absolute
  top -20px
  right -20px
  z-index 1
</style>
