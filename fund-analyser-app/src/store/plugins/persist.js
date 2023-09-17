import VuexPersistence from 'vuex-persist'

export default new VuexPersistence({
  storage: localStorage,
  reducer: state => ({
    account: {
      fundWatchlist: state.account.fundWatchlist,
      recentlyViewedFunds: state.account.recentlyViewedFunds,
      stockWatchlist: state.account.stockWatchlist,
      recentlyViewedStocks: state.account.recentlyViewedStocks,
      favouriteCurrencies: state.account.favouriteCurrencies,
      favouriteSimulateParams: state.account.favouriteSimulateParams
    },
    funds: {
      indicatorSchema: state.funds.indicatorSchema
    }
  })
})
