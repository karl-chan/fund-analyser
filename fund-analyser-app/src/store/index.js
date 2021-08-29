import { createStore } from 'vuex'
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

export const storeInstance = createStore({
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
  // enable strict mode (adds overhead!)
  // for dev mode and --debug builds only
  strict: process.env.DEBUGGING
})

const init = async () => {
  await Promise.all([
    storeInstance.dispatch('auth/init'),
    storeInstance.dispatch('account/init'),
    storeInstance.dispatch('currency/init'),
    storeInstance.dispatch('funds/init'),
    storeInstance.dispatch('simulate/init'),
    storeInstance.dispatch('stocks/init')
  ])
}

init()

// auto-reload when internet connectivity is back up
window.addEventListener('online', init, false)

export default function (/* { ssrContext } */) {
  return storeInstance
}
