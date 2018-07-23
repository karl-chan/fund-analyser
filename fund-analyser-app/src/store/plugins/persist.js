import VuexPersistence from 'vuex-persist'
import localForage from 'localforage'

export default new VuexPersistence({
  strictMode: true,
  storage: localForage,
  reducer: state => ({
    account: {
      watchlist: state.account.watchlist,
      recentlyViewed: state.account.recentlyViewed
    },
    funds: {
      loaded: state.funds.loaded,
      summary: state.funds.summary
    }})
})
