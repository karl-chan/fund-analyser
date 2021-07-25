<template lang="pug">
div.container.shadow-5(v-if="groupedHoldings.length")
  highcharts(:options="chartOptions")
</template>

<script>
import flatten from 'lodash/flatten'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import sumBy from 'lodash/sumBy'
export default {
  name: 'CurrencyPie',
  props: ['holdings'],
  computed: {
    chartOptions: function () {
      return this.buildChartOptions(this.holdings)
    },
    groupedHoldings: function () {
      return Object.entries(
        groupBy(this.holdings, h => h.currency)
      ).filter(([currency, hs]) => currency !== 'null')
    },
    // returns, e.g. [{currency: "GBP", ratio: 0.5}, {currency: "USD", ratio: 0.2}, ... ]
    currencyRatios: function () {
      const total = sumBy(flatten(this.groupedHoldings.map(([currency, hs]) => hs)), 'weight')
      const ratios = this.groupedHoldings.map(([currency, hs]) => {
        const currencySubtotal = sumBy(hs, 'weight')
        return {
          currency,
          ratio: currencySubtotal / total
        }
      })
      return sortBy(ratios, 'ratio')
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
          text: 'Currency Exposure'
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
        series: [
          {
            name: 'Currencies',
            colorByPoint: true,
            data: data
          }
        ],
        credits: {
          enabled: false
        }
      }
      return opts
    },
    buildChartData (holdings) {
      return this.currencyRatios.map(({ currency, ratio }) => {
        return {
          name: currency,
          y: ratio
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  padding: 10px;
  border-radius: 10px;
}
</style>
