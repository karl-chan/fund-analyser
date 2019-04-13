import VuexPersistence from 'vuex-persist'

export default new VuexPersistence({
  storage: localStorage,
  reducer: state => ({
    account: {
      watchlist: state.account.watchlist,
      recentlyViewed: state.account.recentlyViewed,
      currencies: state.account.currencies
    },
    funds: {
      indicatorSchema: state.funds.indicatorSchema
    }
  })
})
