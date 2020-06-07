<template lang="pug">
  q-drawer(v-model="drawerOpen" content-class="bg-grey-2" :width="250")
    q-list(separator)
      // Recently Viewed List
      q-expansion-item(v-if="recentlyViewedIsins.length" label="Recently Viewed" :default-opened="true" expand-separator)
        q-list
          q-item(v-for="entry in recentlyViewed" :to="{name: 'fund', params: {isin: entry.isin}}" :key="entry.isin")
            q-item-section
              q-item-label {{entry.name}}
              q-item-label(caption) {{entry.isin}}
            q-item-section(side)
              q-btn(flat round dense icon="close" @click.stop.prevent="removeFromRecentlyViewed(entry.isin)")
        .row.justify-end
          q-btn.q-mr-sm.q-mb-sm(rounded label="Clear all" color="pink-10" @click="clearRecentlyViewed")
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
              img(src="statics/charles-stanley-direct.jpg" width="120px")
            q-item-section
              q-item-label Charles Stanley Direct
          q-item(clickable @click.native="openURL('http://financialtimes3.herokuapp.com/')")
            q-item-section(avatar)
              q-avatar
                img(src="statics/financial-times.jpg")
            q-item-section
              q-item-label Financial Times
</template>

<script>
import { mapGetters, mapState, mapActions } from 'vuex'
import { openURL } from 'quasar'
export default {
  name: 'AppDrawer',
  computed: {
    ...mapState('account', ['favouriteSimulateParams', 'recentlyViewed', 'watchlist']),
    ...mapGetters('account', ['recentlyViewedIsins']),
    ...mapGetters('auth', ['isLoggedIn']),
    drawerOpen: {
      get () {
        return this.$store.state.layout.drawerOpen
      },
      set (open) {
        this.$store.commit('layout/setDrawerOpen', open)
      }
    }
  },
  methods: {
    openURL,
    ...mapActions('account', [
      'clearRecentlyViewed',
      'removeFromRecentlyViewed',
      'removeFromFavouriteSimulateParams',
      'updateFavouriteSimulateParams'
    ]),
    async pushNotifications () {
      await this.$services.auth.pushNotifications()
    },
    async toggleActiveSimulateParam (simulateParam) {
      await this.updateFavouriteSimulateParams({
        simulateParam,
        active: !simulateParam.active
      })
    }
  }
}
</script>
