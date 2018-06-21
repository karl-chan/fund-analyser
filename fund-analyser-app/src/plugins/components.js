import AccountBalance from 'components/account/AccountBalance'
import ActiveSessions from 'components/auth/ActiveSessions'

import FundSearch from 'components/fund/FundSearch'
import FundInfoBar from 'components/fund/FundInfoBar'
import FundChart from 'components/fund/FundChart'
import FundCharges from 'components/fund/FundCharges'
import FundHoldings from 'components/fund/FundHoldings'
import FundsTable from 'components/fund/FundsTable'
import FundsSummary from 'components/fund/FundsSummary'
import FundWatchList from 'components/fund/FundWatchList'

import AppDrawer from 'components/layout/AppDrawer'
import AppHeader from 'components/layout/AppHeader'

import TipOfTheDay from 'components/misc/TipOfTheDay'

export default ({ Vue }) => {
  Vue.component('account-balance', AccountBalance)
  Vue.component('active-sessions', ActiveSessions)

  Vue.component('fund-search', FundSearch)
  Vue.component('fund-info-bar', FundInfoBar)
  Vue.component('fund-chart', FundChart)
  Vue.component('fund-charges', FundCharges)
  Vue.component('fund-holdings', FundHoldings)
  Vue.component('funds-table', FundsTable)
  Vue.component('funds-summary', FundsSummary)
  Vue.component('fund-watch-list', FundWatchList)
  Vue.component('tip-of-the-day', TipOfTheDay)

  Vue.component('app-drawer', AppDrawer)
  Vue.component('app-header', AppHeader)
}
