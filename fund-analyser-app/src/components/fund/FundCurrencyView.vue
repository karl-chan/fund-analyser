<template lang="pug">
  .col.gutter-y-sm
    currency-pie(:holdings="holdings")
    q-card(v-for="pair in currencyPairs" v-if="lookupCurrency(pair)" :key="pair")
      q-card-media
        currency-chart(:currency="lookupCurrency(pair)")
      q-card-main
        currency-returns(:currency="lookupCurrency(pair)")
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import get from 'lodash/get'
import uniq from 'lodash/uniq'
export default {
  name: 'FundCurrencyView',
  props: ['fund'],
  data: function () {
    return {
      baseCurrency: 'GBP'
    }
  },
  computed: {
    ...mapGetters('currency', ['lookupCurrency']),
    holdings: function () {
      return get(this.fund, 'realTimeDetails.holdings', [])
    },
    currencyPairs: function () {
      const quoteCurrencies = uniq(this.holdings.map(h => h.currency).filter(c => c))
      return quoteCurrencies.map(c => `${c}${this.baseCurrency}`)
    }
  },
  methods: {
    ...mapActions('currency', ['lazyGets'])
  },
  watch: {
    currencyPairs: {
      immediate: true,
      handler (newPairs) {
        this.lazyGets(newPairs)
      }
    }
  }
}
</script>
