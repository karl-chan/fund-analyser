<template lang="pug">
  q-page(padding)
    .absolute-right
      healthcheck
    q-tabs
      q-tab(default label="Account View" slot="title" name="account")
      q-tab(label="Summary View" slot="title" name="summary")

      // Account View
      q-tab-pane.gutter-y-md(keep-alive name="account")
        account-balance(:user="user" :balance="balance")
        fund-watch-list(:watchlist="watchlist")

      // Summary View
      q-tab-pane(keep-alive name="summary")
        funds-summary(:summary="summary" :summaryRequestHandler="getSummary")
</template>

<script>
import { mapState, mapActions } from 'vuex'
export default {
  name: 'HomePage',
  computed: {
    ...mapState('account', ['watchlist']),
    ...mapState('account', {
      balance: state => state.charlesStanleyDirect.balance
    }),
    ...mapState('auth', ['user']),
    ...mapState('funds', ['favouriteIsins', 'summary']),
    watchedFunds: function () {
      return this.watchlist.map(isin => this.lookupFund()(isin))
    }
  },
  methods: {
    ...mapActions('funds', ['getSummary', 'gets'])
  },
  watch: {
    balance: {
      immediate: true,
      handler (newBalance) {
        const isins = this.$utils.account.getIsins(newBalance)
        this.gets(isins)
      }
    },
    watchlist: {
      immediate: true,
      handler (newWatchlist, oldWatchlist) {
        if (newWatchlist && newWatchlist !== oldWatchlist) {
          this.gets(newWatchlist)
        }
      }
    }
  }
}
</script>
