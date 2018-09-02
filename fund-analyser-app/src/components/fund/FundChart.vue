<template lang="pug">
  div.container.shadow-5
    highstock(v-if="fund" :options="chartOptions" ref="highcharts")
    template(v-else) No chart available
</template>

<script>

export default {
  name: 'FundChart',
  props: ['fund'],
  computed: {
    chartOptions: function () {
      return this.buildChartOptions(this.fund)
    }
  },
  methods: {
    buildChartOptions (fund) {
      const opts = {
        chart: {
          zoomType: 'x'
        },
        rangeSelector: {
          selected: 2, // recent 6 months
          buttons: [{ type: 'month', count: 1, text: '1M' },
            { type: 'month', count: 3, text: '3M' },
            { type: 'month', count: 6, text: '6M' },
            { type: 'ytd', text: 'YTD' },
            { type: 'year', count: 1, text: '1Y' },
            { type: 'year', count: 3, text: '3Y' },
            { type: 'year', count: 5, text: '5Y' },
            { type: 'all', text: 'All' }
          ]
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
      if (fund.realTimeDetails) {
        opts.yAxis = {
          plotLines: [{
            value: fund.realTimeDetails.estPrice,
            color: 'green',
            dashStyle: 'shortdash',
            width: 2,
            label: {
              text: `Est. price ${this.formatNumber(fund.realTimeDetails.estPrice)}`
            }
          }]
        }
      }
      return opts
    },
    formatNumber (num) {
      return this.$utils.format.formatNumber(num)
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
