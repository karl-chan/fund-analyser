<template lang="pug">
  div
    .row(v-if="funds" v-for="y in rows")
      .col(v-for="x in cols" :class="background(x, y)")
        fund-chart(v-show="withinBounds(x, y)" :fund="getFundAt(x, y)"
                   style="cursor: pointer"
                   @mouseenter.native="hover(x, y, true)"
                   @mouseleave.native="hover(x, y, false)"
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
    hover (x, y, isMouseOver) {
      const fund = this.getFundAt(x, y)
      this.selectedFund = isMouseOver ? fund : undefined
    },
    background (x, y) {
      const fund = this.getFundAt(x, y)
      if (fund && fund === this.selectedFund) {
        return 'bg-yellow'
      }
    },
    openFundPage (x, y) {
      const fund = this.getFundAt(x, y)
      if (fund) {
        this.$utils.router.redirectToFund(fund.isin, {newTab: true})
      }
    }
  },
  watch: {
    selectedIsin: function (isin) {
      this.selectedFund = this.funds.find(f => f.isin === isin)
    },
    selectedFund: function (fund) {
      this.$emit('chartSelected', fund)
    }
  }
}
</script>
