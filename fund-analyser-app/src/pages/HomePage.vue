<template lang="pug">
q-page(padding)
  .absolute-right
    healthcheck

  account-view(:user="user" :balance="balance" :orders="orders" :statement="statement")

  q-tabs.q-mt-md.bg-primary.text-white(v-model="tab" align="left")
    q-tab(label="Funds" name="funds")
    q-tab(label="Stocks" name="stocks")
    q-tab(label="Currencies" name="currency")
    q-tab(default label="Fund Watchlist" name="fund-watchlist")
    q-tab(default label="Stock Watchlist" name="stock-watchlist")

  q-tab-panels(v-model="tab" keep-alive)
    // Funds
    q-tab-panel(name="funds")
      funds-summary

    // Stocks
    q-tab-panel(name="stocks")
      stocks-summary

    // Currencies
    q-tab-panel(name="currency")
      currency-dashboard

    // Fund Watchlist
    q-tab-panel(name="fund-watchlist")
      fund-watch-list(:fundWatchlist="fundWatchlist")

    // Stock Watchlist
    q-tab-panel(name="stock-watchlist")
      stock-watch-list(:stockWatchlist="stockWatchlist")

</template>

<script>
import isEqual from 'lodash/isEqual'
import { mapActions, mapState } from 'vuex'
export default {
  name: 'HomePage',
  data() {
    return {
      tab: 'stock-watchlist'
    }
  },
  computed: {
    ...mapState('account', ['balance', 'orders', 'statement', 'fundWatchlist', 'stockWatchlist']),
    ...mapState('auth', ['user']),
    ...mapState('funds', ['favouriteIsins'])
  },
  methods: {
    ...mapActions('funds', ['lazyGets'])
  },
  watch: {
    balance: {
      immediate: true,
      handler(newBalance) {
        const isins = this.$utils.account.getIsins(newBalance)
        this.lazyGets(isins)
      }
    },
    fundWatchlist: {
      immediate: true,
      handler(newWatchlist, oldWatchlist) {
        if (newWatchlist && !isEqual(newWatchlist, oldWatchlist)) {
          this.lazyGets(newWatchlist)
        }
      }
    },
    stockWatchlist: {
      immediate: true,
      handler(newWatchlist, oldWatchlist) {
        if (newWatchlist && !isEqual(newWatchlist, oldWatchlist)) {
          this.lazyGets(newWatchlist)
        }
      }
    }
  }
}
</script>
