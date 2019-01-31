export default {
  balance: null, // {cash, holdings, portfolioValue, totalValue}
  statement: null, // {series: [Fund.HistoricPrice], events: [Event]}
  watchlist: [], // [isin: string]
  recentlyViewed: [], // [isin: string]
  currencies: [] // [currencies: string (e.g. 'GBPUSD')]
}
