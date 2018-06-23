<template lang="pug">
  q-page.column.gutter-y-md(padding)
    div(v-if="user")
      account-balance(:user="user" :balance="balance" :realTimeDetails="realTimeDetails")
    div
      fund-watch-list(:watchlist="watchlist" @update:watchlist="setWatchlist($event)")
    div
      funds-summary(:summary="summary" @requestSummary="getSummary"
                    :favouriteIsins="favouriteIsins" @update:favouriteIsins="setFavouriteIsins($event)")
</template>

<script>
import { mapState, mapActions, mapGetters, mapMutations } from 'vuex'
export default {
  name: 'HomePage',
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.getBalance()
    })
  },
  computed: {
    ...mapState('auth', ['user']),
    ...mapState('funds', ['realTimeDetails', 'favouriteIsins', 'summary']),
    ...mapGetters('funds', ['watchlist']),
    balance: function () {
      return this.lookupBalance()
    }
  },
  methods: {
    ...mapActions('account', ['getBalance']),
    ...mapGetters('account', ['lookupBalance']),
    ...mapActions('funds', ['startRealTimeUpdates', 'stopRealTimeUpdates', 'getSummary']),
    ...mapMutations('funds', ['setFavouriteIsins'])
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
