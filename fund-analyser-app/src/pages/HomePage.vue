<template lang="pug">
  q-page(padding)
    .absolute-right
      healthcheck

    account-view(:user="user" :balance="balance" :orders="orders" :statement="statement")

    q-tabs.q-mt-md.bg-primary.text-white(v-model="tab" align="left")
      q-tab(default label="Account View" name="account")
      q-tab(label="Summary View" name="summary")
      q-tab(label="Currency View" name="currency")

    q-tab-panels(v-model="tab" keep-alive )
      // Account View
      q-tab-panel(name="account")
        fund-watch-list(:fundWatchlist="fundWatchlist")

      // Summary View
      q-tab-panel(name="summary")
        funds-summary

      // Currency View
      q-tab-panel(name="currency")
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
    ...mapState('account', ['balance', 'orders', 'statement', 'fundWatchlist']),
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
    fundWatchlist: {
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
