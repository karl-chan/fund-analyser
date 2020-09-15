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
import simulate from './simulate'
import stocks from './stocks'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    account,
    admin,
    auth,
    currency,
    funds,
    layout,
    simulate,
    stocks
  },
  plugins: [
    persist.plugin,
    realTimeDetailsPoller
  ],
  strict: process.env.NODE_ENV !== 'production'
})

const init = async () => {
  await Promise.all([
    store.dispatch('auth/init'),
    store.dispatch('account/init'),
    store.dispatch('currency/init'),
    store.dispatch('funds/init'),
    store.dispatch('simulate/init'),
    store.dispatch('stocks/init')
  ])
}

init()

// auto-reload when internet connectivity is back up
window.addEventListener('online', init, false)

export default store
