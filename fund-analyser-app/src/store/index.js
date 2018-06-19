import Vue from 'vue'
import Vuex from 'vuex'
import { sync } from 'vuex-router-sync'

import account from './account'
import auth from './auth'
import funds from './funds'
import layout from './layout'
import misc from './misc'
import router from './../router'

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
    RESTORE_MUTATION: persist.RESTORE_MUTATION // this mutation **MUST** be named "RESTORE_MUTATION"
  },
  strict: process.env.NODE_ENV !== 'production'
})

export default store

sync(store, router)
store.dispatch('auth/init')
