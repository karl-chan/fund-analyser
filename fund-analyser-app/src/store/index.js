import Vue from 'vue'
import Vuex from 'vuex'

import account from './account'
import auth from './auth'
import funds from './funds'
import layout from './layout'
import misc from './misc'

import persist from './plugins/persist'
import realTimeDetailsPoller from './plugins/real-time-details-poller'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    account,
    auth,
    funds,
    layout,
    misc
  },
  plugins: [
    persist.plugin,
    realTimeDetailsPoller
  ],
  strict: process.env.NODE_ENV !== 'production'
})

export default store

store.dispatch('auth/init')
store.dispatch('account/init')
