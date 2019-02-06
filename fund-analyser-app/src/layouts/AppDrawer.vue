<template lang="pug">
  q-layout-drawer(v-model="drawerOpen" content-class="bg-grey-2")
    q-list(no-border separator)
      // Recently Viewed List
      q-collapsible(v-if="recentlyViewedIsins.length" label="Recently Viewed" :opened="true" :separator="true")
        q-list(no-border)
          q-item(v-for="entry in recentlyViewed" :to="{name: 'fund', params: {isin: entry.isin}}")
            q-item-main(:label="entry.name" :sublabel="entry.isin")
            q-item-side(right)
              q-btn(flat round dense icon="close" @click.stop="removeFromRecentlyViewed(entry.isin)")
        .row.justify-end
          q-btn(label="Clear all" color="pink-10" :rounded="true" @click="clearRecentlyViewed")
      // Links
      q-collapsible(label="Links" :opened="true")
        q-list(no-border link)
          q-item(@click.native="openURL('https://www.charles-stanley-direct.co.uk/')")
            q-item-side(image="statics/charles-stanley-direct.jpg")
            q-item-main(label="Charles Stanley Direct")
          q-item(@click.native="openURL('http://financialtimes3.herokuapp.com/')")
            q-item-side(avatar="statics/financial-times.jpg")
            q-item-main(label="Financial Times")
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
