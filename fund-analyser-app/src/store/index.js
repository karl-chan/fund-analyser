import Vue from 'vue'
import Vuex from 'vuex'

import account from './account'
import auth from './auth'
import funds from './funds'
import layout from './layout'
import misc from './misc'

import persist from './plugins/persist'

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
    persist.plugin
  ],
  mutations: {
    // this mutation **MUST** be named "RESTORE_MUTATION"
    RESTORE_MUTATION (state, args) {
      persist.RESTORE_MUTATION.call(this, state, args)

      if (args.funds && args.funds.loaded && args.funds.loaded.length) {
        const loadedIsins = Object.keys(args.funds.loaded)
        store.dispatch('funds/startRealTimeUpdates', loadedIsins)
      }
    }
  },
  strict: process.env.NODE_ENV !== 'production'
})

export default store

store.dispatch('auth/init')
store.dispatch('account/init')
