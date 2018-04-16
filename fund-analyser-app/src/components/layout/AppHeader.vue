<template lang="pug">
  q-layout-header
    q-toolbar(color="green")
      q-btn(flat dense round @click="toggleDrawer")
        q-icon(name="menu")
      q-toolbar-title
        | Fund Analyser
        div(slot="subtitle") Your mutual funds toolkit
      fund-search.absolute-center(placeholder="Start typing a fund name" @select="onFundSelect")
      q-btn.q-mr-lg(v-if="isLoggedIn" flat dense size="lg" icon="perm_device_information" @click="activeSessionsOpen = true")
        active-sessions(:open.sync="activeSessionsOpen")
      q-btn(flat dense size="lg" :icon="authIcon" @click="authClick")
      q-btn(flat dense size="lg" icon="home" @click="$utils.router.redirectToHome")
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
export default {
  name: 'AppHeader',
  data () {
    return {
      loginIcon: 'account_circle',
      logoutIcon: 'fas fa-sign-out-alt',
      activeSessionsOpen: false
    }
  },
  computed: {
    ...mapGetters('auth', ['isLoggedIn']),
    authIcon: function () {
      return this.isLoggedIn ? this.logoutIcon : this.loginIcon
    }
  },
  methods: {
    ...mapActions('layout', ['toggleDrawer']),
    authClick () {
      if (this.isLoggedIn) {
        this.$utils.router.redirectToLogout()
      } else {
        this.$utils.router.redirectToLogin()
      }
    },
    onFundSelect (fund) {
      this.$utils.router.redirectToFund(fund.isin)
    }
  }
}
</script>

<style>
</style>
