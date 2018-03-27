<template lang="pug">
  vue-highcharts(v-if="fund" :Highcharts="Highstock" :options="chartOptions")
  div(v-else) No chart available
</template>

<script>
import VueHighcharts from 'vue2-highcharts'
import Highstock from 'highcharts/highstock'
import Highmaps from 'highcharts/modules/map'

Highmaps(Highstock)

export default {
  name: 'fund-chart',
  props: ['fund'],
  components: {
    VueHighcharts
  },
  data () {
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
  }
}
</script>
