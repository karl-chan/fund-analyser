import isEqual from 'lodash/isEqual'

export function inFundWatchlist (state) {
  return isin => state.fundWatchlist.includes(isin)
}

export function recentlyViewedIsins (state) {
  return state.recentlyViewedFunds.map(e => e.isin)
}

export function inStockWatchlist (state) {
  return symbol => state.stockWatchlist.includes(symbol)
}

export function recentlyViewedSymbols (state) {
  return state.recentlyViewedStocks.map(e => e.symbol)
}

export function inFavouriteSimulateParams (state) {
  return simulateParam => state.favouriteSimulateParams.some(param =>
    isEqual(param.strategy, simulateParam.strategy) &&
    isEqual(param.isins, simulateParam.isins) &&
    isEqual(param.numPortfolio, simulateParam.numPortfolio)
  )
}
