<template lang="pug">
  q-layout-drawer(v-model="drawerOpen" content-class="bg-grey-2")
    q-list(no-border link inset-delimiter)
      template(v-if="recentlyViewedIsins.length")
        recently-viewed-list
        q-item-separator
      q-list-header Links
      q-item(@click.native="openURL('https://www.charles-stanley-direct.co.uk/')")
        q-item-side(image="statics/charles-stanley-direct.jpg")
        q-item-main(label="Charles Stanley Direct")
      q-item(@click.native="openURL('http://financialtimes.herokuapp.com/')")
        q-item-side(avatar="statics/financial-times.jpg")
        q-item-main(label="Financial Times")
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { openURL } from 'quasar'
export default {
  name: 'AppDrawer',
  computed: {
    ...mapState('account', ['watchlist']),
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
    openURL
  }
}
</script>
