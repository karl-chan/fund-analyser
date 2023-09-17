export default {
  balance: null, // {cash, holdings, portfolioValue, totalValue}
  orders: [],
  statement: null, // {series: [Fund.HistoricPrice], events: [Event]}
  fundWatchlist: [], // [isin: string]
  recentlyViewedFunds: [], // [{isin: string, name: string}]
  stockWatchlist: [], // [symbol: string]
  recentlyViewedStocks: [], // [{symbol: string, name: string}]
  favouriteCurrencies: [], // [favouriteCurrencies: string (e.g. 'GBPUSD')]
  favouriteSimulateParams: [] // [simulateParam: SimulateParam]
}
