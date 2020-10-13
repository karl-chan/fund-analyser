<template lang="pug">
  .shadow-5.container
      highcharts(v-if="currency" constructor-type="stockChart" :options="chartOptions")
      template(v-else) No chart available

</template>

<script>

export default {
  name: 'CurrencyChart',
  props: {
    currency: Object
  },
  computed: {
    chartOptions: function () {
      return this.buildChartOptions(this.currency)
    }
  },
  methods: {
    buildChartOptions (currency) {
      const vm = this
      const opts = {
        chart: {
          zoomType: 'x',
          events: {
            selection (e) {
              const { min, max } = e.xAxis[0]
              const { rate: startRate } = vm.$utils.currency.findClosestRecord(min, vm.currency.historicRates)
              const { rate: endRate } = vm.$utils.currency.findClosestRecord(max, vm.currency.historicRates)
              if (startRate && endRate) {
                const percentReturn = (endRate - startRate) / startRate
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
          text: `${currency.base} ${currency.quote}`
        },
        series: [{
          name: 'Rate',
          data: currency.historicRates.map(record => [Date.parse(record.date), record.rate])
        }],
        mapNavigation: {
          enableMouseWheelZoom: true
        },
        credits: {
          enabled: false
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
.container
  padding 10px
  border-radius 10px

</style>
