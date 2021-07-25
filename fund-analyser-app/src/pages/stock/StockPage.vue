<template lang="pug">
q-page(padding)
  template(v-if="loading")
    .absolute-center.row.items-center.text-purple.q-gutter-x-lg
      q-spinner-facebook(size="72px" color="purple")
      .text-h3 Loading

  template(v-else-if="stock")
    // header
    .row.items-center.q-gutter-sm.q-mb-md
      .text-h5 {{stock.name}}
      div
        q-btn(icon="autorenew" label="Renew" @click="refreshStock" color="secondary" rounded glossy)
      div
        q-btn(color="purple" icon="open_in_new" label="NASDAQ" @click="openURL(`https://www.nasdaq.com/market-activity/stocks/${stock.symbol}/real-time`)")
      div
        q-btn(color="blue" icon="open_in_new" label="Free Real Time" @click="openURL(`https://quotes.freerealtime.com/quotes/${stock.symbol}/Time%26Sales`)")

    // middle section
    fund-info-bar(:fund="stock")
    .row.q-gutter-lg
      div Bid-ask spread:
        .text-h6 {{ $utils.format.formatPercentage(stock.realTimeDetails.bidAskSpread, true) }}
      div Longest time gap (seconds):
        .text-h6 {{ $utils.format.formatSeconds(stock.realTimeDetails.longestTimeGap) }}

    .row.q-col-gutter-x-sm.q-mt-lg
      .col-md-7
        fund-chart(:fund="stock")
      .col-md-5
        fund-indicators(:fund="stock")

  template(v-else)
    .absolute-center.row.items-center.q-gutter-x-sm.text-red
      q-icon(name="error" color="error" size="144px")
      .text-h2 Sorry! Error loading stock
</template>

<script>
import { openURL } from 'quasar'
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'StockPage',
  props: ['symbol'],
  beforeRouteEnter (to, from, next) {
    next(async vm => {
      vm.loading = true
      const stocks = await vm.lazyGets([to.params.symbol])
      vm.loading = false
      stocks.forEach(stock => {
        vm.addToRecentlyViewedStocks({ symbol: stock.symbol, name: stock.name })
        vm.updateRealTimeDetails([stock.symbol])
      })
    })
  },
  async beforeRouteUpdate (to, from, next) {
    next()
    if (to.params.symbol !== from.params.symbol) {
      this.loading = true
      const stocks = await this.lazyGets([to.params.symbol])
      this.loading = false
      stocks.forEach(stock => {
        this.addToRecentlyViewedStocks({ symbol: stock.symbol, name: stock.name })
        this.updateRealTimeDetails([stock.symbol])
      })
    }
  },
  data () {
    return {
      loading: true,
      hoveringFavouriteIcon: false
    }
  },
  computed: {
    ...mapGetters('account', ['inWatchlist']),
    ...mapGetters('stocks', ['lookupStock']),
    stock: function () {
      return this.lookupStock(this.symbol)
    },
    isFavourite: function () {
      return this.inWatchlist(this.symbol)
    },
    favouriteIcon: function () {
      return this.isFavourite ^ this.hoveringFavouriteIcon ? 'star' : 'star_outline'
    }
  },
  methods: {
    openURL,
    ...mapActions('account', ['addToRecentlyViewedStocks', 'addToStockWatchlist', 'removeFromStockWatchlist']),
    ...mapActions('stocks', ['gets', 'lazyGets', 'updateRealTimeDetails']),
    async refreshStock () {
      this.loading = true
      await this.gets([this.symbol])
      this.loading = false
    },
    onFavouriteIconHovering (isMouseEnter) {
      this.hoveringFavouriteIcon = isMouseEnter
    },
    toggleWatchlist (symbol) {
      this.isFavourite ? this.removeFromStockWatchlist(symbol) : this.addToStockWatchlist(symbol)
    }
  }
}
</script>
