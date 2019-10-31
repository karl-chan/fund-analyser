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
              q-btn(flat round dense icon="close" @click.stop="removeFromRecentlyViewed(entry.isin)")
        .row.justify-end
          q-btn.q-mr-sm.q-mb-sm(label="Clear all" color="pink-10" :rounded="true" @click="clearRecentlyViewed")
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
    ...mapState('account', ['recentlyViewed', 'watchlist']),
    ...mapGetters('account', ['recentlyViewedIsins']),
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
    ...mapActions('account', ['removeFromRecentlyViewed', 'clearRecentlyViewed'])
  }
}
</script>
