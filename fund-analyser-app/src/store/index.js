import Vue from 'vue'
import Vuex from 'vuex'
import account from './account'
import admin from './admin'
import auth from './auth'
import currency from './currency'
import funds from './funds'
import layout from './layout'
import persist from './plugins/persist'
import realTimeDetailsPoller from './plugins/real-time-details-poller'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    account,
    admin,
    auth,
    currency,
    funds,
    layout
  },
  plugins: [
    persist.plugin,
    realTimeDetailsPoller
  ],
  strict: process.env.NODE_ENV !== 'production'
})

const init = async () => {
  await store.dispatch('auth/init')
  await store.dispatch('account/init')
  await store.dispatch('currency/init')
  await store.dispatch('funds/init')
}

init()

// auto-reload when internet connectivity is back up
window.addEventListener('online', init, false)

export default store
