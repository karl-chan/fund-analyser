<template lang="pug">
  q-page.column.gutter-y-md(padding)
    div
      account-balance(:user="user" :balance="balance")
    div
      fund-watch-list(:watchlist="watchlist")
    div
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
    ...mapActions('funds', ['getSummary', 'lazyGet'])
  },
  watch: {
    balance: {
      immediate: true,
      handler (newBalance) {
        const isins = this.$utils.account.getIsins(newBalance)
        isins.forEach(this.lazyGet)
      }
    },
    watchlist: {
      immediate: true,
      handler (newWatchlist) {
        newWatchlist.forEach(this.lazyGet)
      }
    }
  }
}
</script>
