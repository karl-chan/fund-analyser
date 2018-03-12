<template>
  <q-layout view="hHh Lpr lFf">
    <q-layout-header>
      <q-toolbar color="green">
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
        >
          <q-icon name="menu" />
        </q-btn>

        <q-toolbar-title>
          Fund Analyser App
          <div slot="subtitle">Running on Quasar v{{ $q.version }}</div>
        </q-toolbar-title>

        <fund-search class="absolute-center"/>
      </q-toolbar>
    </q-layout-header>

    <q-layout-drawer
      v-model="leftDrawerOpen"
      content-class="bg-grey-2"
    >
      <q-list
        no-border
        link
        inset-delimiter
      >
        <template v-if="loadedFunds.length">
          <q-list-header>Recently Viewed</q-list-header>
          <q-item v-for="fund in loadedFunds" :to="{name: 'fund', params: {isin: fund.isin}}" :key="fund.isin" v-close-overlay>
            <q-item-main
              :label="fund.name"
              :sublabel="fund.isin"/>
            <q-item-side right>
              <q-btn flat round dense icon="close" @click.stop="removeFund(fund.isin)" />
            </q-item-side>
          </q-item>
          <q-item-separator />
        </template>
        <q-list-header>Links</q-list-header>
        <q-item @click.native="openURL('https://www.charles-stanley-direct.co.uk/')">
          <q-item-side image="http://www.isa.co.uk/images/isa-providers/charles-stanley.jpg" />
          <q-item-main label="Charles Stanley Direct" />
        </q-item>
        <q-item @click.native="openURL('http://financialtimes.herokuapp.com/')">
          <q-item-side avatar="https://pbs.twimg.com/profile_images/931156393108885504/EqEMtLhM_400x400.jpg" />
          <q-item-main label="Financial Times" />
        </q-item>
      </q-list>
    </q-layout-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { mapState } from 'vuex'
import { openURL } from 'quasar'

export default {
  name: 'LayoutDefault',
  data () {
    return {
      leftDrawerOpen: this.$q.platform.is.desktop
    }
  },
  computed: {
    ...mapState('funds', {
      loadedFunds: 'loaded'
    })
  },
  methods: {
    openURL,
    removeFund (isin) {
      this.$store.dispatch('funds/remove', isin)
    }
  }
}
</script>

<style>
</style>
