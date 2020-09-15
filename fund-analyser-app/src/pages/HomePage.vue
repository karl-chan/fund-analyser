<template lang="pug">
  q-page(padding)
    .absolute-right
      healthcheck

    account-view(:user="user" :balance="balance" :orders="orders" :statement="statement")

    q-tabs.q-mt-md.bg-primary.text-white(v-model="tab" align="left")
      q-tab(default label="Watchlist" name="watchlist")
      q-tab(label="Funds" name="funds")
      q-tab(label="Stocks" name="stocks")
      q-tab(label="Currencies" name="currency")

    q-tab-panels(v-model="tab" keep-alive )
      // Watchlist
      q-tab-panel(name="watchlist")
        fund-watch-list(:fundWatchlist="fundWatchlist")

      // Funds
      q-tab-panel(name="funds")
        funds-summary

      // Stocks
      q-tab-panel(name="stocks")
        stocks-summary

      // Currencies
      q-tab-panel(name="currency")
        currency-dashboard
</template>

<script>
import { mapState, mapActions } from 'vuex'
import isEqual from 'lodash/isEqual'
export default {
  name: 'HomePage',
  data () {
    return {
      tab: 'watchlist'
    }
  },
  computed: {
    ...mapState('account', ['balance', 'orders', 'statement', 'fundWatchlist']),
    ...mapState('auth', ['user']),
    ...mapState('funds', ['favouriteIsins'])
  },
  methods: {
    ...mapActions('funds', ['lazyGets'])
  },
  watch: {
    balance: {
      immediate: true,
      handler (newBalance) {
        const isins = this.$utils.account.getIsins(newBalance)
        this.lazyGets(isins)
      }
    },
    fundWatchlist: {
      immediate: true,
      handler (newWatchlist, oldWatchlist) {
        if (newWatchlist && !isEqual(newWatchlist, oldWatchlist)) {
          this.lazyGets(newWatchlist)
        }
      }
    }
  }
}
</script>
