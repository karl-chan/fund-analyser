<template lang="pug">
  div
    .column.q-gutter-y-xs(v-if="fund")
      // real time details
      .row.items-center.q-gutter-md(v-if="fund.realTimeDetails")
        .row.items-center Today's change (estimate):
          span.text-weight-bold.text-h5.q-ml-sm(:class="colour(fund.realTimeDetails.estChange)") {{ formatPercentage(fund.realTimeDetails.estChange) }}
        div New price (est): {{ formatNumber(fund.realTimeDetails.estPrice) }}
        div Std dev: {{ formatPercentage(fund.realTimeDetails.stdev) }}
        div 95% Confidence interval:
          |
          | ({{ formatPercentage(fund.realTimeDetails.ci[0]) }},
          | {{ formatPercentage(fund.realTimeDetails.ci[1]) }})

      // alert banner (if outdated)
      q-banner.bg-negative.text-white(v-if="numDaysOutdated > 1" dense) This fund is {{numDaysOutdated}} days outdated
        template(v-slot:avatar)
          q-icon(name="warning")

      // historic returns summary
      .row.items-center.q-gutter-xs
        div(v-for="(periodReturn, period) in fund.returns" :key="period")
          | {{period}}:
          |
          span(:class="colour(periodReturn)") {{ formatPercentage(periodReturn) }}
      .row.items-center.q-gutter-lg
        div Last price:
          .q-title {{ lastHistoricPrice.price }}
        div Historic prices as of:
          .q-title {{ $utils.format.formatDateLong(lastHistoricPrice.date) }}
        div(v-if="fund.realTimeDetails") Real time estimate as of:
          .q-title {{ $utils.format.formatFromNow(fund.realTimeDetails.lastUpdated) }}
    div(v-else)
      q-icon(name="info") No information available
</template>

<script>
export default {
  name: 'FundInfoBar',
  props: ['fund'],
  computed: {
    lastHistoricPrice: function () {
      return this.fund.historicPrices[this.fund.historicPrices.length - 1] || { date: undefined, price: undefined }
    },
    numDaysOutdated: function () {
      return (this.fund && this.$utils.date.diffBusinessDays(new Date(), this.fund.asof)) ||
       0
    }
  },
  methods: {
    colour (num) {
      return this.$utils.format.colourNumber(num)
    },
    formatNumber (num) {
      return this.$utils.format.formatNumber(num)
    },
    formatPercentage (num) {
      return this.$utils.format.formatPercentage(num, true)
    }
  }
}
</script>
