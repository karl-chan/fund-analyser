<template lang="pug">
  div(v-if="fund" :id="chartId" style="width: 400px; height: 300px;")
  div(v-else) No chart available
</template>

<script>
import { uid } from 'quasar'
import Highcharts from 'highcharts'
import Highstock from 'highcharts/modules/stock'
import Highmaps from 'highcharts/modules/map'

Highstock(Highcharts)
Highmaps(Highcharts)

export default {
  name: 'fund-chart',
  props: ['fund'],
  mounted () {
    if (this.fund) {
      this.initialiseChart(this.fund)
    }
  },
  computed: {
    chartId: function () {
      return `fund-chart-${uid()}`
    }
  },
  methods: {
    initialiseChart (fund) {
      Highcharts.stockChart(this.chartId, this.buildChartOptions(fund))
    },
    buildChartOptions (fund) {
      return {
        chart: {
          zoomType: 'x'
        },
        rangeSelector: {
          selected: 2 // recent 6 months
        },
        title: {
          text: `${fund.name}`
        },
        series: [{
          name: 'Price',
          data: fund.historicPrices.map(record => [Date.parse(record.date), record.price])
        }],
        mapNavigation: {
          enableMouseWheelZoom: true
        },
        credits: {
          enabled: false
        }
      }
    }
  },
  watch: {
    fund: function (newVal, oldVal) {
      this.initialiseChart(newVal)
    }
  }
}
</script>
