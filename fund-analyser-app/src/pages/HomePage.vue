<template lang="pug">
  q-page.column.gutter-y-md(padding)
    .absolute-right
      healthcheck
    account-balance(:user="user" :balance="balance")
    fund-watch-list(:watchlist="watchlist")
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
