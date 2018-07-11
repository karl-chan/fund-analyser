<template lang="pug">
  q-page.column.gutter-y-md(padding)
    div(v-if="user")
      account-balance(:user="user" :balance="balance")
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
    ...mapState('funds', ['favouriteIsins', 'summary']),
    balance: function () {
      return this.lookupBalance()
    },
    watchedFunds: function () {
      return this.summary.filter(fund => this.watchlist.includes(fund.isin))
    }
  },
  methods: {
    ...mapGetters('account', ['lookupBalance']),
    ...mapActions('funds', ['getSummary'])
  }
}
</script>
