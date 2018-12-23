<template lang="pug">
  q-page(padding)
    .absolute-right
      healthcheck
    q-tabs
      q-tab(default label="Account View" slot="title" name="account")
      q-tab(label="Summary View" slot="title" name="summary")

      // Account View
      q-tab-pane.gutter-y-md(keep-alive name="account")
        account-view(:user="user" :balance="balance" :statement="statement")
        fund-watch-list(:watchlist="watchlist")

      // Summary View
      q-tab-pane(keep-alive name="summary")
        funds-summary
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
