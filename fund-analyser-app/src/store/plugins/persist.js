import VuexPersistence from 'vuex-persist'

export default new VuexPersistence({
  storage: localStorage,
  reducer: state => ({
    account: {
      fundWatchlist: state.account.fundWatchlist,
      recentlyViewedFunds: state.account.recentlyViewedFunds,
      favouriteCurrencies: state.account.favouriteCurrencies,
      favouriteSimulateParams: state.account.favouriteSimulateParams
    },
    funds: {
      indicatorSchema: state.funds.indicatorSchema
    }
  })
})
