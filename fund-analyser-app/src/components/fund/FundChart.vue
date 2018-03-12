<template>
  <highcharts v-if="fund" :Highcharts="Highstock" :options="chartOptions"/>
  <div v-else>No chart available</div>
</template>

<script>
import Highstock from 'highcharts/highstock'
import Highmaps from 'highcharts/modules/map'

Highmaps(Highstock)

export default {
  name: 'fund-chart',
  props: ['fund'],
  data: function () {
    return {
      Highstock: Highstock
    }
  },
  computed: {
    chartOptions: function () {
      return this.buildChartOptions(this.fund)
    }
  },
  methods: {
    buildChartOptions (fund) {
      return {
        chart: {
          zoomType: 'x'
        },
        rangeSelector: {
          selected: 5
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
  }
}
</script>

<style>
</style>
