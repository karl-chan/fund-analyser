<template lang="pug">
  q-layout(view="hHh Lpr lFf")
    q-layout-header
      q-toolbar(color="green")
        q-btn(flat dense round @click="toggleDrawer")
          q-icon(name="menu")
        q-toolbar-title
          | Fund Analyser
          div(slot="subtitle") Your mutual funds toolkit
        fund-search.absolute-center(placeholder="Start typing a fund name" @select="onFundSelect")
        q-btn(flat dense size="lg" icon="home" @click="$router.push({name: 'home'})")
    q-layout-drawer(v-model="drawerOpen" content-class="bg-grey-2")
      q-list(no-border link inset-delimiter)
        template(v-if="numLoadedFunds")
          q-list-header Recently Viewed
            q-btn.float-right(label="Clear all" color="red" @click="removeAll")
          q-item(v-for="fund in loadedFunds" :to="{name: 'fund', params: {isin: fund.isin}}" :key="fund.isin")
            q-item-main(:label="fund.name" :sublabel="fund.isin")
            q-item-side(right)
              q-btn(flat round dense icon="close" @click.stop="removeFund(fund.isin)")
          q-item-separator
        q-list-header Links
        q-item(@click.native="openURL('https://www.charles-stanley-direct.co.uk/')")
          q-item-side(image="statics/charles-stanley-direct.jpg")
          q-item-main(label="Charles Stanley Direct")
        q-item(@click.native="openURL('http://financialtimes.herokuapp.com/')")
          q-item-side(avatar="statics/financial-times.jpg")
          q-item-main(label="Financial Times")
    q-page-container
      tip-of-the-day.relative-position(style="z-index: 1")
      router-view
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { openURL } from 'quasar'

export default {
  name: 'LayoutDefault',
  computed: {
    ...mapState('funds', {
      loadedFunds: 'loaded'
    }),
    ...mapGetters('funds', ['numLoadedFunds']),
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
    onFundSelect (fund) {
      this.$router.push({ name: 'fund', params: { isin: fund.isin } })
    },
    removeFund (isin) {
      this.$store.dispatch('funds/remove', isin)
    },
    ...mapActions('funds', ['removeAll']),
    ...mapActions('layout', ['toggleDrawer'])
  }
}
</script>

<style>
</style>
