<template lang="pug">
  .shadow-5(:class="{container: !simple}")
      highstock(v-if="fund" :options="chartOptions" ref="highcharts")
      template(v-else) No chart available

</template>

<script>

export default {
  name: 'FundChart',
  props: {
    fund: Object,
    simple: Boolean
  },
  computed: {
    chartOptions: function () {
      return this.simple
        ? this.buildSimpleChartOptions(this.fund)
        : this.buildChartOptions(this.fund)
    }
  },
  methods: {
    buildChartOptions (fund) {
      const vm = this
      const opts = {
        chart: {
          zoomType: 'x',
          events: {
            selection (e) {
              const { min, max } = e.xAxis[0]
              const { price: startPrice } = vm.$utils.fund.findClosestRecord(min, vm.fund.historicPrices)
              const { price: endPrice } = vm.$utils.fund.findClosestRecord(max, vm.fund.historicPrices)
              if (startPrice && endPrice) {
                const percentReturn = (endPrice - startPrice) / startPrice
                this.renderer.label(vm.$utils.format.formatPercentage(percentReturn, true), e.target.chartWidth * 0.65, 0)
                  .css({
                    color: percentReturn < 0 ? 'red' : 'green',
                    fontSize: '40px',
                    fontWeight: 'bold'
                  })
                  .add()
                  .fadeOut(2000)
              }
            }
          }
        },
        rangeSelector: {
          selected: 4, // recent 1 year
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
    buildSimpleChartOptions (fund) {
      const opts = {
        series: [{
          name: 'Price',
          data: fund.historicPrices.map(record => [Date.parse(record.date), record.price])
        }],
        chart: {
          height: 150
        },
        credits: {
          enabled: false
        },
        navigator: {
          enabled: false
        },
        plotOptions: {
          series: {
            enableMouseTracking: false
          }
        },
        rangeSelector: {
          enabled: false
        },
        scrollbar: {
          enabled: false
        }
      }
      return opts
    },
    formatNumber (num) {
      return this.$utils.format.formatNumber(num)
    }
  },
  watch: {
    '$route.query': {
      immediate: true,
      handler: function (query) {
        const { startDate, endDate } = query
        setTimeout(() => {
          const { chart } = this.$refs.highcharts
          if (startDate && endDate) {
            chart.xAxis[0].setExtremes(Date.parse(startDate), Date.parse(endDate))
            chart.xAxis[1].setExtremes(Date.parse(startDate), Date.parse(endDate))
          }
        }, 0)
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.container
  padding 10px
  border-radius 10px

</style>
