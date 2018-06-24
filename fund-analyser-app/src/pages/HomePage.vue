<template lang="pug">
  q-page.column.gutter-y-md(padding)
    div(v-if="user")
      account-balance(:user="user" :balance="balance" :realTimeDetails="realTimeDetails")
    div
      fund-watch-list(:watchlist="watchedFunds")
    div
      funds-summary(:summary="summary" @requestSummary="getSummary")
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
export default {
  name: 'HomePage',
  computed: {
    ...mapState('account', ['watchlist']),
    ...mapState('auth', ['user']),
    ...mapState('funds', ['realTimeDetails', 'favouriteIsins', 'summary']),
    balance: function () {
      return this.lookupBalance()
    },
    watchedFunds: function () {
      return this.summary.filter(fund => this.watchlist.includes(fund.isin))
    }
  },
  methods: {
    ...mapGetters('account', ['lookupBalance']),
    ...mapActions('funds', ['startRealTimeUpdates', 'stopRealTimeUpdates', 'getSummary'])
  },
  watch: {
    balance: function (newBalance, oldBalance) {
      const oldIsins = this.$utils.account.getIsins(oldBalance)
      oldIsins.forEach(this.stopRealTimeUpdates)

      const newIsins = this.$utils.account.getIsins(newBalance)
      newIsins.forEach(this.startRealTimeUpdates)
    }
  }
}
</script>
