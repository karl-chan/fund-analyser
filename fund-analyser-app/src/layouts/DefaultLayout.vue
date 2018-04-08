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
        q-btn(flat dense size="lg" :icon="authIcon" @click="authClick")
        q-btn(flat dense size="lg" icon="home" @click="$utils.router.redirectToHome")
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
    q-page-container
      tip-of-the-day
      router-view
      q-ajax-bar(color="lime")
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { openURL } from 'quasar'

export default {
  name: 'DefaultLayout',
  data () {
    return {
      loginIcon: 'account circle',
      logoutIcon: 'fas fa-sign-out-alt'
    }
  },
  computed: {
    ...mapState('funds', {
      loadedFunds: 'loaded'
    }),
    ...mapGetters('funds', ['numLoadedFunds']),
    ...mapGetters('auth', ['isLoggedIn']),
    drawerOpen: {
      get () {
        return this.$store.state.layout.drawerOpen
      },
      set (open) {
        this.$store.commit('layout/setDrawerOpen', open)
      }
    },
    authIcon: function () {
      return this.isLoggedIn ? this.logoutIcon : this.loginIcon
    }
  },
  methods: {
    openURL,
    onFundSelect (fund) {
      this.$utils.router.redirectToFund(fund.isin)
    },
    removeFund (isin) {
      this.$store.dispatch('funds/remove', isin)
    },
    ...mapActions('auth', ['login']),
    ...mapActions('funds', ['removeAll']),
    ...mapActions('layout', ['toggleDrawer']),
    authClick () {
      if (this.isLoggedIn) {
        this.$utils.router.redirectToLogout()
      } else {
        this.$utils.router.redirectToLogin()
      }
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
