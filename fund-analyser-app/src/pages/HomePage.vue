<template lang="pug">
  q-page(padding)
    .absolute-right
      healthcheck

    account-view(:user="user" :balance="balance" :statement="statement")

    q-tabs.q-mt-md
      q-tab(default label="Account View" slot="title" name="account")
      q-tab(label="Summary View" slot="title" name="summary")
      q-tab(label="Currency View" slot="title" name="currency")

      // Account View
      q-tab-pane(keep-alive name="account")
        fund-watch-list(:watchlist="watchlist")

      // Summary View
      q-tab-pane(keep-alive name="summary")
        funds-summary

      // Currency View
      q-tab-pane(keep alive name="currency")
        currency-dashboard
</template>

<script>
import { mapState, mapActions } from 'vuex'
import isEqual from 'lodash/isEqual'
export default {
  name: 'HomePage',
  computed: {
    ...mapState('account', ['balance', 'statement', 'watchlist']),
    ...mapState('auth', ['user']),
    ...mapState('funds', ['favouriteIsins']),
    watchedFunds: function () {
      return this.watchlist.map(isin => this.lookupFund()(isin))
    }
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
    watchlist: {
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
