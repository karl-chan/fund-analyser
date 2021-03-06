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

export default ({ Vue }) => {
  Vue.component('account-balance', AccountBalance)
  Vue.component('account-orders', AccountOrders)
  Vue.component('account-returns-bar', AccountReturnsBar)
  Vue.component('account-statement', AccountStatement)
  Vue.component('account-view', AccountView)

  Vue.component('active-sessions', ActiveSessions)
  Vue.component('password-field', PasswordField)

  Vue.component('fund-search', FundSearch)
  Vue.component('fund-info-bar', FundInfoBar)
  Vue.component('fund-chart', FundChart)
  Vue.component('fund-chart-grid', FundChartGrid)
  Vue.component('fund-charges', FundCharges)
  Vue.component('fund-currency-view', FundCurrencyView)
  Vue.component('fund-holdings', FundHoldings)
  Vue.component('fund-indicators', FundIndicators)
  Vue.component('funds-table', FundsTable)
  Vue.component('funds-summary', FundsSummary)
  Vue.component('fund-watch-list', FundWatchList)
  Vue.component('similar-funds', SimilarFunds)

  Vue.component('stock-search', StockSearch)
  Vue.component('stocks-table', StocksTable)
  Vue.component('stocks-summary', StocksSummary)

  Vue.component('currency-chart', CurrencyChart)
  Vue.component('currency-dashboard', CurrencyDashboard)
  Vue.component('currency-pie', CurrencyPie)
  Vue.component('currency-returns', CurrencyReturns)
  Vue.component('currency-table', CurrencyTable)

  Vue.component('simulate-request', SimulateRequest)
  Vue.component('simulate-response', SimulateResponse)
  Vue.component('simulate-response-footer', SimulateResponseFooter)
  Vue.component('simulate-response-modal', SimulateResponseModal)

  Vue.component('composite-search', CompositeSearch)
  Vue.component('healthcheck', Healthcheck)
  Vue.component('tip-of-the-day', TipOfTheDay)

  Vue.component('app-drawer', AppDrawer)
  Vue.component('app-header', AppHeader)
}
