import { LocalStorage } from 'quasar'
import Vue from 'vue'
import Vuex from 'vuex'
import { sync } from 'vuex-router-sync'
import createPersistedState from 'vuex-persistedstate'

import funds from './funds'
import layout from './layout'
import misc from './misc'
import router from './../router'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    funds,
    layout,
    misc
  },
  plugins: [createPersistedState({
    paths: ['funds.loaded', 'funds.summary'],
    storage: {
      getItem: LocalStorage.get.item,
      setItem: LocalStorage.set,
      removeItem: LocalStorage.remove
    }
  })]
})
sync(store, router)

export default store
