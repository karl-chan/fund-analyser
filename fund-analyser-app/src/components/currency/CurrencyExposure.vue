<template lang="pug">
  div.container.shadow-5
    highcharts(v-if="holdings" :options="chartOptions" ref="highcharts")
    template(v-else) No chart available
</template>

<script>
import groupBy from 'lodash/groupBy'
import sumBy from 'lodash/sumBy'
export default {
  name: 'CurrencyExposure',
  props: ['holdings'],
  computed: {
    chartOptions: function () {
      return this.buildChartOptions(this.holdings)
    }
  },
  methods: {
    buildChartOptions (holdings) {
      const data = this.buildChartData(holdings)
      const opts = {
        chart: {
          type: 'pie'
        },
        title: {
          text: `Currency Exposure`
        },
        tooltip: {
          pointFormat: '{series.name}: <b>{point.percentage:.0f}%</b>'
        },
        plotOptions: {
          pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
              enabled: true,
              format: '<b>{point.name}</b>: {point.percentage:.0f} %'
            }
          }
        },
        series: [{
          name: 'Currencies',
          colorByPoint: true,
          data: data
        }],
        credits: {
          enabled: false
        }
      }
      return opts
    },
    buildChartData (holdings) {
      if (!holdings) {
        return []
      }
      const data = Object.entries(groupBy(holdings, h => h.currency))
        .filter(([currency, hs]) => currency !== 'null')
        .map(([currency, hs]) => {
          return {
            name: currency,
            y: sumBy(hs, 'weight')
          }
        })
      return data
    }
  }
}
</script>

<style lang="stylus" scoped>
.container {
  padding: 10px;
  border-radius: 10px;
}
</style>
