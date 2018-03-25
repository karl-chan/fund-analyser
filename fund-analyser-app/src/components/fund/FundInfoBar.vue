<template lang="pug">
  div
    .column.gutter-y-xs(v-if="fund")
      // real time details
      .row.items-center.gutter-lg(v-if="realTimeDetails")
        div.row.items-center Today's change (estimate):
          |
          span.text-weight-bold.q-headline(:class="colour(realTimeDetails.estChange)") {{ formatPercentage(realTimeDetails.estChange) }}
        div Std dev: {{ formatPercentage(realTimeDetails.stdev) }}
        div 95% Confidence interval:
          |
          | ({{ formatPercentage(realTimeDetails.ci[0]) }},
          | {{ formatPercentage(realTimeDetails.ci[1]) }})

      // historic returns summary
      .row.items-center.gutter-xs
        div(v-for="(periodReturn, period) in fund.returns" :key="period")
          | {{period}}:
          |
          span(:class="colour(periodReturn)") {{ formatPercentage(periodReturn) }}
      .row.items-center.gutter-lg
        div Last price:
          .q-title {{ lastHistoricPrice.price }}
        div Historic prices as of:
          .q-title {{ $utils.format.formatDateLong(lastHistoricPrice.date) }}
    div(v-else)
      q-icon(name="info") No information available
</template>

<script>
export default {
  name: 'FundInfoBar',
  props: ['fund', 'realTimeDetails'],
  computed: {
    lastHistoricPrice: function () {
      return this.fund.historicPrices[this.fund.historicPrices.length - 1] || {date: undefined, price: undefined}
    }
  },
  methods: {
    colour (num) {
      return this.$utils.format.colourNumber(num)
    },
    formatPercentage (num) {
      return this.$utils.format.formatPercentage(num, true)
    }
  }
}
</script>
