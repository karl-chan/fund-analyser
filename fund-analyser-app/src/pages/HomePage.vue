<template lang="pug">
  q-page.column.gutter-y-md(padding)
    div(v-if="user")
      account-balance(:user="user" :balance="balance" :realTimeDetails="realTimeDetails")
    div
      .q-headline Watch List
      fund-watch-list(:watchlist="watchlist")
    div
      .q-headline Summary
      funds-summary(:summary="summary" @requestSummary="getSummary")
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
export default {
  name: 'HomePage',
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.getBalance()
    })
  },
  computed: {
    balance: function () {
      return this.lookupBalance()
    },
    ...mapState('auth', ['user']),
    ...mapState('funds', ['realTimeDetails', 'watchlist', 'summary'])
  },
  methods: {
    ...mapActions('account', [ 'getBalance' ]),
    ...mapGetters('account', [ 'lookupBalance' ]),
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
