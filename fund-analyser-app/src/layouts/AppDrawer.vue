<template lang="pug">
q-drawer(v-model="drawerOpen" content-class="bg-grey-2" :width="250")
  q-list(separator)
    // Recently Viewed Funds List
    q-expansion-item(v-if="recentlyViewedIsins.length" label="Recently Viewed Funds" :default-opened="true" expand-separator)
      q-list
        q-item(v-for="fund in recentlyViewedFunds" :to="{name: 'fund', params: {isin: fund.isin}}" :key="fund.isin")
          q-item-section
            q-item-label {{fund.name}}
            q-item-label(caption) {{fund.isin}}
          q-item-section(side)
            q-btn(flat round dense icon="close" @click.stop.prevent="removeFromRecentlyViewedFunds(fund.isin)")
      .row.justify-end
        q-btn.q-mr-sm.q-mb-sm(rounded label="Clear all" color="pink-10" @click="clearRecentlyViewedFunds")
    // Recently Viewed Stocks List
    q-expansion-item(v-if="recentlyViewedSymbols.length" label="Recently Viewed Stocks" :default-opened="true" expand-separator)
      q-list
        q-item(v-for="stock in recentlyViewedStocks" :to="{name: 'stock', params: {symbol: stock.symbol}}" :key="stock.symbol")
          q-item-section
            q-item-label {{stock.name}}
            q-item-label(caption) {{stock.symbol}}
          q-item-section(side)
            q-btn(flat round dense icon="close" @click.stop.prevent="removeFromRecentlyViewedStocks(stock.symbol)")
      .row.justify-end
        q-btn.q-mr-sm.q-mb-sm(rounded label="Clear all" color="pink-10" @click="clearRecentlyViewedStocks")
    // Simulate
    q-expansion-item(v-if="favouriteSimulateParams.length" label="Simulations" :default-opened="true" expand-separator)
      q-list
        q-item(v-for="simulateParam in favouriteSimulateParams" :to="{name: 'simulate', params: {simulateParam: JSON.stringify(simulateParam)}}" :key="JSON.stringify(simulateParam)")
          q-item-section
            q-item-label {{simulateParam.strategy}}
            q-item-label(caption) Top {{simulateParam.numPortfolio}} - {{simulateParam.isins.join(',')}}
          q-item-section(side)
            .row
              q-btn(v-if="isLoggedIn" flat round dense icon="flash_on"
                :color="simulateParam.active? 'amber': undefined"
                @click.stop.prevent="toggleActiveSimulateParam(simulateParam)")
q-tooltip Click to {{simulateParam.active?  'stop': 'start'}} trading
  q-btn(flat round dense icon="close" @click.stop.prevent="removeFromFavouriteSimulateParams(simulateParam)")
    .row.justify-end(v-if="isLoggedIn")
      q-btn.q-mr-sm.q-mb-sm(push icon="notifications" color="red-10" @click="pushNotifications")
        q-tooltip Push notifications
    // Links
    q-expansion-item(label="Links" :default-opened="true" expand-separator)
      q-list
        q-item(clickable @click.native="openURL('https://www.charles-stanley-direct.co.uk/')")
          q-item-section(side)
            img(src="charles-stanley-direct.jpg" width="120px")
          q-item-section
            q-item-label Charles Stanley Direct
        q-item(clickable @click.native="openURL('https://tinyurl.com/freeft/')")
          q-item-section(avatar)
            q-avatar
              img(src="financial-times.jpg")
          q-item-section
            q-item-label Financial Times
</template>

<script>
import { openURL } from 'quasar'
import { mapActions, mapGetters, mapState } from 'vuex'
export default {
  name: 'AppDrawer',
  computed: {
    ...mapState('account', ['favouriteSimulateParams', 'recentlyViewedFunds', 'fundWatchlist', 'recentlyViewedStocks', 'stockWatchlist']),
    ...mapGetters('account', ['recentlyViewedIsins', 'recentlyViewedSymbols']),
    ...mapGetters('auth', ['isLoggedIn']),
    drawerOpen: {
      get() {
        return this.$store.state.layout.drawerOpen
      },
      set(open) {
        this.$store.commit('layout/setDrawerOpen', open)
      }
    }
  },
  methods: {
    openURL,
    ...mapActions('account', [
      'clearRecentlyViewedFunds',
      'removeFromRecentlyViewedFunds',
      'clearRecentlyViewedStocks',
      'removeFromRecentlyViewedStocks',
      'removeFromFavouriteSimulateParams',
      'updateFavouriteSimulateParams'
    ]),
    async pushNotifications() {
      await this.$services.auth.pushNotifications()
    },
    async toggleActiveSimulateParam(simulateParam) {
      await this.updateFavouriteSimulateParams({
        simulateParam,
        active: !simulateParam.active
      })
    }
  }
}
</script>
