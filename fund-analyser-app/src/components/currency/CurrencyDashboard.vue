<template lang="pug">
    .column.gutter-y-sm
      .q-headline Currency Dashboard
        .row.justify-start.items-center
          // user search bar
          q-search.shadow-2(v-model="currenciesFilter" placeholder="Add currency (e.g. GBPUSD)" color="grey-2" inverted-light clearable upper-case)
            q-autocomplete(@search="search" @selected="onSelectCurrency")
          q-spinner-dots.q-ml-md(color="primary" v-if="loading")

      // grid of currencies
      .row(v-for="y in rows")
        .col.relative-position(v-for="x in cols")
          div(v-show="withinBounds(x, y)")
            currency-chart.chart(:currency="getCurrencyAt(x, y)")
            .row.items-center.gutter-xs
              div(v-for="(periodReturn, period) in getCurrencyAt(x, y).returns" :key="period")
                | {{period}}:
                |
                .text-weight-bold(:class="colour(periodReturn)") {{ formatPercentage(periodReturn) }}
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
      cols: 3,
      loading: false
    }
  },
  computed: {
    ...mapState('currency', ['supportedCurrencies', 'loaded']),
    ...mapState('account', ['currencies']),
    rows: function () {
      return Math.ceil(this.loadedCurrencies.length / this.cols)
    },
    supportedCurrencyPairs () {
      return flatten(
        this.supportedCurrencies.map(c1 =>
          this.supportedCurrencies.map(c2 => ({ base: c1, quote: c2 }))
        )
      )
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
      this.loading = true
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
    },
    colour (num) {
      return this.$utils.format.colourNumber(num)
    },
    formatPercentage (num) {
      return this.$utils.format.formatPercentage(num, true)
    }
  },
  watch: {
    currencies: {
      immediate: true,
      async handler (newCurrencies, oldCurrencies) {
        if (newCurrencies && !isEqual(newCurrencies, oldCurrencies)) {
          await this.lazyGets(newCurrencies)
          this.loading = false
        }
      }
    }
  }
}
</script>

<style lang="stylus">
.close-btn {
  position: absolute;
  top: -20px;
  right: -20px;
  z-index: 1;
}
</style>
