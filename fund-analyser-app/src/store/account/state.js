export default {
  balance: null, // {cash, holdings, portfolioValue, totalValue}
  orders: [],
  statement: null, // {series: [Fund.HistoricPrice], events: [Event]}
  fundWatchlist: [], // [isin: string]
  recentlyViewed: [], // [isin: string]
  favouriteCurrencies: [], // [favouriteCurrencies: string (e.g. 'GBPUSD')]
  favouriteSimulateParams: [] // [simulateParam: SimulateParam]
}
