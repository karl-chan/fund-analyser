<template lang="pug">
.column.q-gutter-y-sm
  .text-h5 Currency Dashboard
  // currency table
  currency-table(height="500px" :currencies="summary.currencies" :stats="summary.stats")

  // grid of currencies
  .row(v-for="y in rows" :key="y")
    .col.relative-position(v-for="x in cols" :key="x")
      div(v-show="withinBounds(x, y)")
        currency-chart(:currency="getCurrencyAt(x, y)")
        currency-returns(:currency="getCurrencyAt(x, y)")
        q-btn.close-btn(round push icon="close" size="lg" color="secondary" @click="removeCurrency(x, y)")
</template>

<script>
import { mapState, mapActions } from 'vuex'
import isEqual from 'lodash/isEqual'
import at from 'lodash/at'
export default {
  name: 'CurrencyDashboard',
  data: function () {
    return {
      cols: 3
    }
  },
  computed: {
    ...mapState('currency', ['loaded', 'summary']),
    ...mapState('account', ['favouriteCurrencies']),
    rows: function () {
      return Math.ceil(this.loadedCurrencies.length / this.cols)
    },
    loadedCurrencies: function () {
      return at(this.loaded, this.favouriteCurrencies).filter(c => c) // remove undefined's
    }
  },
  methods: {
    ...mapActions('currency', ['lazyGets']),
    ...mapActions('account', ['addToFavouriteCurrencies', 'removeFromFavouriteCurrencies']),
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
        this.removeFromFavouriteCurrencies(symbol)
      }
    }
  },
  watch: {
    favouriteCurrencies: {
      immediate: true,
      async handler (newCurrencies, oldCurrencies) {
        if (newCurrencies && !isEqual(newCurrencies, oldCurrencies)) {
          await this.lazyGets(newCurrencies)
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.close-btn {
  position: absolute;
  top: -20px;
  right: -20px;
  z-index: 1;
}
</style>
