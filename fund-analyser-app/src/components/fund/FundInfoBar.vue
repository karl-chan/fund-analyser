<template lang="pug">
  .row.justify-between(v-if="fund")
    // real time details
    .column.gutter-y-xs
      .row.items-center.gutter-md(v-if="realTimeDetails")
        div Today's change (estimate):
          span.text-weight-bold.q-headline(:class="color(realTimeDetails.estChange)")
            | {{ formatPercentage(realTimeDetails.estChange) }}
        div Std dev: {{ formatPercentage(realTimeDetails.stdev) }}
        div Confidence interval:
          |
          | ({{ formatPercentage(realTimeDetails.ci[0]) }},
          | {{ formatPercentage(realTimeDetails.ci[1]) }})
        div Last price: {{ lastHistoricPrice.price }}

      // historic returns summary
      .row.gutter-xs
        div(v-for="(periodReturn, period) in fund.returns" :key="period")
          | {{period}}:
          |
          span(:class="color(periodReturn)") {{ formatPercentage(periodReturn) }}
      .row.gutter-xs
        div Historic prices as of: <span class="q-title">{{ $utils.formatUtils.formatDate(lastHistoricPrice.date) }}</span>
    q-btn(color="amber" icon="open_in_new" label="Open in FT" @click="openURL('https://markets.ft.com/data/funds/tearsheet/summary?s=' + fund.isin)")
  div(v-else="")
    q-icon(name="info") No information available
</template>

<script>
import { openURL } from 'quasar'
export default {
  name: 'FundInfoBar',
  props: ['fund', 'realTimeDetails'],
  computed: {
    lastHistoricPrice: function () {
      return this.fund.historicPrices[this.fund.historicPrices.length - 1]
    }
  },
  methods: {
    openURL,
    color (num) {
      return this.$utils.formatUtils.colorNumber(num)
    },
    formatPercentage (num) {
      return this.$utils.formatUtils.formatPercentage(num, true)
    }
  }
}
</script>

<style>
</style>
