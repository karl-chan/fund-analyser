import VuexPersistence from 'vuex-persist'

export default new VuexPersistence({
  storage: localStorage,
  reducer: state => ({
    account: {
      watchlist: state.account.watchlist,
      recentlyViewed: state.account.recentlyViewed
    }
  })
})
