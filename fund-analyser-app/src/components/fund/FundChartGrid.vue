<template lang="pug">
  div
    .row(v-if="funds" v-for="y in rows" :key="y")
      .col(v-for="x in cols" :key="x")
        fund-chart.chart(v-show="withinBounds(x, y)" :fund="getFundAt(x, y)"
                   :class="{selected: isSelected(x, y)}"
                   @click.native="selectFundAt(x, y)"
                   @dblclick.native="openFundPage(x, y)")
</template>

<script>

export default {
  name: 'FundChartGrid',
  props: ['funds', 'cols', 'selectedIsin'],
  data () {
    return {
      selectedFund: null
    }
  },
  computed: {
    rows: function () {
      return Math.ceil(this.funds.length / this.cols)
    }
  },
  methods: {
    // x, y start from 1, not 0
    indexAt (x, y) {
      return (y - 1) * this.cols + (x - 1)
    },
    withinBounds (x, y) {
      return this.indexAt(x, y) < this.funds.length
    },
    getFundAt (x, y) {
      return this.withinBounds(x, y) ? this.funds[this.indexAt(x, y)] : undefined
    },
    selectFundAt (x, y) {
      this.selectedFund = this.getFundAt(x, y)
    },
    isSelected (x, y) {
      return this.getFundAt(x, y) === this.selectedFund
    },
    openFundPage (x, y) {
      const fund = this.getFundAt(x, y)
      if (fund) {
        this.$utils.router.redirectToFund(fund.isin, { newTab: true })
      }
    }
  },
  watch: {
    selectedIsin: function (isin) {
      this.selectedFund = this.funds.find(f => f.isin === isin)
    },
    selectedFund: function (fund) {
      this.$emit('chart-selected', fund)
    }
  }
}
</script>

<style lang="stylus" scoped>
.chart
  cursor pointer
  &:hover, &.selected
    background-color gold
</style>
