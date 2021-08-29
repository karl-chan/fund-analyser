import AccountBalance from 'components/account/AccountBalance'
import AccountOrders from 'components/account/AccountOrders'
import AccountReturnsBar from 'components/account/AccountReturnsBar'
import AccountStatement from 'components/account/AccountStatement'
import AccountView from 'components/account/AccountView'
import ActiveSessions from 'components/auth/ActiveSessions'
import PasswordField from 'components/auth/PasswordField'
import CurrencyChart from 'components/currency/CurrencyChart'
import CurrencyDashboard from 'components/currency/CurrencyDashboard'
import CurrencyPie from 'components/currency/CurrencyPie'
import CurrencyReturns from 'components/currency/CurrencyReturns'
import CurrencyTable from 'components/currency/CurrencyTable'
import FundCharges from 'components/fund/FundCharges'
import FundChart from 'components/fund/FundChart'
import FundChartGrid from 'components/fund/FundChartGrid'
import FundCurrencyView from 'components/fund/FundCurrencyView'
import FundHoldings from 'components/fund/FundHoldings'
import FundIndicators from 'components/fund/FundIndicators'
import FundInfoBar from 'components/fund/FundInfoBar'
import FundSearch from 'components/fund/FundSearch'
import FundsSummary from 'components/fund/FundsSummary'
import FundsTable from 'components/fund/FundsTable'
import FundWatchList from 'components/fund/FundWatchList'
import SimilarFunds from 'components/fund/SimilarFunds'
import CompositeSearch from 'components/misc/CompositeSearch'
import Healthcheck from 'components/misc/Healthcheck'
import TipOfTheDay from 'components/misc/TipOfTheDay'
import SimulateRequest from 'components/simulate/SimulateRequest'
import SimulateResponse from 'components/simulate/SimulateResponse'
import SimulateResponseFooter from 'components/simulate/SimulateResponseFooter'
import SimulateResponseModal from 'components/simulate/SimulateResponseModal'
import StockSearch from 'components/stock/StockSearch'
import StocksSummary from 'components/stock/StocksSummary'
import StocksTable from 'components/stock/StocksTable'
import AppDrawer from 'layouts/AppDrawer'
import AppHeader from 'layouts/AppHeader'

export default ({ app }) => {
  app.component('account-balance', AccountBalance)
  app.component('account-orders', AccountOrders)
  app.component('account-returns-bar', AccountReturnsBar)
  app.component('account-statement', AccountStatement)
  app.component('account-view', AccountView)

  app.component('active-sessions', ActiveSessions)
  app.component('password-field', PasswordField)

  app.component('fund-search', FundSearch)
  app.component('fund-info-bar', FundInfoBar)
  app.component('fund-chart', FundChart)
  app.component('fund-chart-grid', FundChartGrid)
  app.component('fund-charges', FundCharges)
  app.component('fund-currency-view', FundCurrencyView)
  app.component('fund-holdings', FundHoldings)
  app.component('fund-indicators', FundIndicators)
  app.component('funds-table', FundsTable)
  app.component('funds-summary', FundsSummary)
  app.component('fund-watch-list', FundWatchList)
  app.component('similar-funds', SimilarFunds)

  app.component('stock-search', StockSearch)
  app.component('stocks-table', StocksTable)
  app.component('stocks-summary', StocksSummary)

  app.component('currency-chart', CurrencyChart)
  app.component('currency-dashboard', CurrencyDashboard)
  app.component('currency-pie', CurrencyPie)
  app.component('currency-returns', CurrencyReturns)
  app.component('currency-table', CurrencyTable)

  app.component('simulate-request', SimulateRequest)
  app.component('simulate-response', SimulateResponse)
  app.component('simulate-response-footer', SimulateResponseFooter)
  app.component('simulate-response-modal', SimulateResponseModal)

  app.component('composite-search', CompositeSearch)
  app.component('healthcheck', Healthcheck)
  app.component('tip-of-the-day', TipOfTheDay)

  app.component('app-drawer', AppDrawer)
  app.component('app-header', AppHeader)
}
