<template lang="pug">
  q-page(padding)
    .absolute-right
      healthcheck

    account-view(:user="user" :balance="balance" :orders="orders" :statement="statement")

    q-tabs.q-mt-md.bg-primary.text-white(v-model="tab" align="left")
      q-tab(default label="Account View" name="account")
      q-tab(label="Summary View" name="summary")
      q-tab(label="Currency View" name="currency")

    q-tab-panels(v-model="tab")
      // Account View
      q-tab-panel(keep-alive name="account")
        fund-watch-list(:watchlist="watchlist")

      // Summary View
      q-tab-panel(keep-alive name="summary")
        funds-summary

      // Currency View
      q-tab-panel(keep-alive name="currency")
        currency-dashboard
</template>

<script>
import { mapState, mapActions } from 'vuex'
import isEqual from 'lodash/isEqual'
export default {
  name: 'HomePage',
  data () {
    return {
      tab: 'account'
    }
  },
  computed: {
    ...mapState('account', ['balance', 'orders', 'statement', 'watchlist']),
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
