<template lang="pug">
  div.container.shadow-5
    highstock(v-if="fund" :options="chartOptions")
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

<style lang="stylus" scoped>
.container {
  padding: 10px;
  border-radius: 10px;
}
</style>
