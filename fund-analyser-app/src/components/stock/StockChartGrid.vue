<template lang="pug">
div
  .row(v-if="stocks" v-for="y in rows" :key="y")
    .col(v-for="x in cols" :key="x")
      fund-chart.chart(v-show="withinBounds(x, y)" :fund="getStockAt(x, y)"
        :class="{selected: isSelected(x, y)}"
        @click.native="selectStockAt(x, y)"
        @dblclick.native="openStockPage(x, y)")
</template>

<script>

export default {
  name: 'StockChartGrid',
  props: ['stocks', 'cols', 'selectedSymbol'],
  data() {
    return {
      selectedStock: null
    }
  },
  computed: {
    rows: function () {
      return Math.ceil(this.stocks.length / this.cols)
    }
  },
  methods: {
    // x, y start from 1, not 0
    indexAt(x, y) {
      return (y - 1) * this.cols + (x - 1)
    },
    withinBounds(x, y) {
      return this.indexAt(x, y) < this.stocks.length
    },
    getStockAt(x, y) {
      return this.withinBounds(x, y) ? this.stocks[this.indexAt(x, y)] : undefined
    },
    selectStockAt(x, y) {
      this.selectedStock = this.getStockAt(x, y)
    },
    isSelected(x, y) {
      return this.getStockAt(x, y) === this.selectedStock
    },
    openStockPage(x, y) {
      const stock = this.getStockAt(x, y)
      if (stock) {
        this.$utils.router.redirectToStock(stock.symbol, { newTab: true })
      }
    }
  },
  watch: {
    selectedSymbol: function (symbol) {
      this.selectedStock = this.stocks.find(s => s.symbol === symbol)
    },
    selectedStock: function (stock) {
      this.$emit('chart-selected', stock)
    }
  }
}
</script>

<style lang="scss" scoped>
.chart {
  cursor: pointer;
}

.chart:hover,
.chart.selected {
  background-color: #ffd700;
}
</style>
