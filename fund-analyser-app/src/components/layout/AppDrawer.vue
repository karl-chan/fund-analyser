<template lang="pug">
  q-layout-drawer(v-model="drawerOpen" content-class="bg-grey-2")
    q-list(no-border link inset-delimiter)
      template(v-if="numLoadedFunds")
        q-list-header Recently Viewed
          q-btn.clear-all(label="Clear all" color="red" @click="removeAll" dense)
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
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import { openURL } from 'quasar'
export default {
  name: 'AppDrawer',
  computed: {
    ...mapState('funds', {
      loadedFunds: 'loaded'
    }),
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
    ...mapActions('funds', ['removeAll']),
    ...mapGetters('funds', ['numLoadedFunds']),
    removeFund (isin) {
      this.$store.dispatch('funds/remove', isin)
    }
  }
}
</script>

<style scoped>
  .q-btn.clear-all {
    float: right;
    margin-top: 10px;
    margin-right: 30px;
    line-height: 0;
  }
</style>
