import VuexPersistence from 'vuex-persist'
import localForage from 'localforage'

export default new VuexPersistence({
  strictMode: true,
  storage: localForage,
  reducer: state => ({
    funds: {
      favouriteIsins: state.funds.favouriteIsins,
      loaded: state.funds.loaded,
      summary: state.funds.summary
    }})
})
