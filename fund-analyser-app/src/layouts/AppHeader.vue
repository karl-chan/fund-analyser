<template lang="pug">
q-header
  q-toolbar.bg-green.shadow-2
    q-btn(flat dense round @click="toggleDrawer")
      q-icon(name="menu")
    q-toolbar-title
      q-item
        q-item-section
          q-item-label.text-weight-medium Fund Analyser
          q-item-label(caption).text-white Your mutual funds toolkit
    composite-search.absolute-center(placeholder="Search fund / stock" @input="onSelection")
    q-btn.q-mr-lg(v-if="isLoggedIn" flat dense size="lg" icon="perm_device_information" @click="activeSessionsOpen = true")
      active-sessions(:open.sync="activeSessionsOpen")
      q-tooltip Active Sessions
    q-btn(flat dense size="lg" :icon="authIcon" @click="authClick")
      q-tooltip {{ isLoggedIn ? 'Logout': 'Login'}}
    q-btn(flat dense size="lg" icon="fas fa-flask" @click="$utils.router.redirectToSimulate")
      q-tooltip Simulate
    q-btn(flat dense size="lg" icon="insert_chart" @click="$utils.router.redirectToLogs")
      q-tooltip Logs
    q-btn(flat dense size="lg" icon="home" @click="$utils.router.redirectToHome")
      q-tooltip Home
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
    onSelection ({ isin, symbol }) {
      if (isin) {
        this.$utils.router.redirectToFund(isin)
      } else if (symbol) {
        this.$utils.router.redirectToStock(symbol)
      }
    }
  }
}
</script>
