import { LocalStorage } from 'quasar'
import Vue from 'vue'
import Vuex from 'vuex'
import { sync } from 'vuex-router-sync'
import createPersistedState from 'vuex-persistedstate'

import * as actions from './actions'
import funds from './funds'
import router from './../router'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    funds
  },
  actions: actions,
  plugins: [createPersistedState({
    paths: ['funds.loaded'],
    storage: {
      getItem: LocalStorage.get.item,
      setItem: LocalStorage.set,
      removeItem: LocalStorage.remove
    }
  })]
})
sync(store, router)
store.dispatch('init')

export default store
