<template lang="pug">
  .column
    .shadow-5.container
        highstock(v-if="statement.series" :options="chartOptions")
    .row.gutter-x-sm.q-mt-md
      div(v-for="(periodReturn, period) in statement.returns" :key="period")
        div {{period}}
        .text-weight-bold(:class="$utils.format.colourNumber(periodReturn)") {{ $utils.format.formatPercentage(periodReturn) }}
</template>

<script>
import fromPairs from 'lodash/fromPairs'
import meanBy from 'lodash/meanBy'
import uniq from 'lodash/uniq'
export default {
  name: 'AccountStatement',
  props: ['statement'],
  data: function () {
    return {
      colours: [[153, 102, 204], [255, 191, 0], [164, 198, 57], [205, 149, 117], [0, 128, 0], [0, 127, 255], [233, 214, 107], [203, 65, 84]]
    }
  },
  computed: {
    chartOptions: function () {
      return this.buildChartOptions(this.statement)
    },
    colourMap: function () {
      return this.statement ? this.assignColourMap(this.statement) : {}
    }
  },
  methods: {
    buildChartOptions (statement) {
      const vm = this
      const opts = {
        chart: {
          zoomType: 'x',
          events: {
            selection (e) {
              const { min, max } = e.xAxis[0]
              const { price: startPrice } = vm.$utils.fund.findClosestRecord(min, vm.statement.series)
              const { price: endPrice } = vm.$utils.fund.findClosestRecord(max, vm.statement.series)
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
          text: 'Performance History'
        },
        series: this.buildChartSeries(statement),
        mapNavigation: {
          enableMouseWheelZoom: true
        },
        resetZoomButton: {
          position: {
            align: 'right', // by default
            verticalAlign: 'top' // by default

          }
        },
        credits: {
          enabled: false
        }
      }
      return opts
    },
    buildChartSeries (statement) {
      const series = []
      if (!statement.events.length) {
        return [{ name: 'Cash', data: statement.series.map(hp => [Date.parse(hp.date), hp.price]) }]
      }

      const getPeriodRange = event => {
        switch (event.type) {
          case 'deposit': // fallthrough
          case 'withdraw': // fallthrough
          case 'fee': return Array(2).fill(Date.parse(event.date))
          case 'fund': return [event.from, event.to].map(Date.parse)
          default: throw new Error('Unrecognised event: ' + event)
        }
      }

      const holdingsToColour = holdings => {
        const baseColours = holdings.map(h => this.colourMap[h.sedol])
        const [r, g, b] = [0, 1, 2].map(i => meanBy(baseColours.map(c => c[i])))
        return [r, g, b]
      }
      const toRGB = colour => {
        const [r, g, b] = colour
        return `rgb(${r}, ${g}, ${b})`
      }

      let i = 0, j = 0
      let [periodStart, periodEnd] = getPeriodRange(statement.events[j])
      let data = []
      while (i < statement.series.length) {
        while (i < statement.series.length && Date.parse(statement.series[i].date) <= periodStart) {
          data.push([Date.parse(statement.series[i].date), statement.series[i].price])
          i++
        }
        i--
        if (data.length) {
          series.push({ name: 'Cash', data, color: toRGB(this.colourMap['Cash']) })
        }
        data = []
        while (i < statement.series.length && Date.parse(statement.series[i].date) <= periodEnd) {
          data.push([Date.parse(statement.series[i].date), statement.series[i].price])
          i++
        }
        i--
        switch (statement.events[j].type) {
          case 'deposit': series.push({
            name: 'Deposit',
            data: [[Date.parse(statement.series[i].date), statement.series[i + 1].price]],
            color: toRGB(this.colourMap['Deposit']),
            marker: { enabled: true, radius: 10, symbol: 'triangle' }
          }); break
          case 'withdrawal': series.push({
            name: 'Withdrawal',
            data: [[Date.parse(statement.series[i].date), statement.series[i].price]],
            color: toRGB(this.colourMap['Withdrawal']),
            marker: { enabled: true, radius: 10, symbol: 'triangle-down' }
          }); break
          case 'fee': series.push({
            name: 'Fee',
            data: [[Date.parse(statement.series[i].date), statement.series[i].price]],
            color: toRGB(this.colourMap['Fee']),
            marker: { enabled: true, radius: 5, symbol: 'circle' }
          }); break
          case 'fund': series.push({
            name: statement.events[j].holdings.map(h => h.name).join(', '),
            data,
            color: toRGB(holdingsToColour(statement.events[j].holdings))
          }); break
          default: throw new Error('Unrecognised event: ' + statement.events[j])
        }
        data = []
        j++
        if (j === statement.events.length) {
          break
        }
        [periodStart, periodEnd] = getPeriodRange(statement.events[j])
      }

      while (i < statement.series.length) {
        data.push([Date.parse(statement.series[i].date), statement.series[i].price])
        i++
      }
      if (data.length) {
        series.push({ name: 'Cash', data, color: toRGB(this.colourMap['Cash']) })
      }
      return series
    },
    assignColourMap (statement) {
      const sedols = uniq(statement.events
        .filter(event => event.type === 'fund')
        .flatMap(fundEvent => fundEvent.holdings.map(h => h.sedol)))

      return {
        ...fromPairs(sedols.map((sedol, i) => {
          const randomColour = this.colours[i % this.colours.length]
          return [sedol, randomColour]
        })),
        'Deposit': [0, 175, 0], // green
        'Withdrawal': [255, 0, 0], // red
        'Cash': [50, 50, 50], // gray
        'Fee': [255, 0, 0] // red
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
