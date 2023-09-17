<template lang="pug">
.column.q-gutter-y-sm
  // table
  stocks-table(:symbols="stockWatchlist" :highlightSymbol="selectedSymbol" @row-selected="onRowSelected")
    template(v-slot:title="")
      .row.justify-between.items-center
        .text-h5 Stock Watchlist
        q-btn.q-ml-xl(outline color="red" @click="clearStockWatchlist") Remove all
    template(v-slot:empty-view="")
      q-tooltip
        .row.items-center
          | Right click on stocks in
          .text-weight-bold.q-px-sm SUMMARY VIEW
          | >
          q-icon.q-mx-xs(name="star" color="amber")
          | Add to watch list
      q-chip.absolute-center.shadow-5(square detail icon="warning" color="secondary" text-color="white" style="{z-index: 1}") Your stock watchlist is empty

  // charts
  stock-chart-grid(:stocks="stocks" :cols="3" :selectedSymbol="selectedSymbol" @chart-selected="onChartSelected")
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
export default {
  name: 'StockWatchList',
  props: ['stockWatchlist'],
  data() {
    return {
      selectedSymbol: null
    }
  },
  computed: {
    ...mapGetters('stocks', ['lookupStock']),
    stocks: function () {
      return this.stockWatchlist.map(symbol => this.lookupStock(symbol))
        .filter(s => s) // remove undefined entries in case stock not ready
    }
  },
  methods: {
    ...mapActions('account', ['clearStockWatchlist']),
    onRowSelected(params) {
      this.selectedSymbol = params.data.symbol
    },
    onChartSelected(stock) {
      this.selectedSymbol = stock && stock.symbol
    }
  }
}
</script>
