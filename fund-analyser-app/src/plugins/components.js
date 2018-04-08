import AccountBalance from 'components/account/AccountBalance'

import FundSearch from 'components/fund/FundSearch'
import FundInfoBar from 'components/fund/FundInfoBar'
import FundChart from 'components/fund/FundChart'
import FundHoldings from 'components/fund/FundHoldings'
import FundsTable from 'components/fund/FundsTable'

import TipOfTheDay from 'components/misc/TipOfTheDay'

export default ({ Vue }) => {
  Vue.component('account-balance', AccountBalance)
  Vue.component('fund-search', FundSearch)
  Vue.component('fund-info-bar', FundInfoBar)
  Vue.component('fund-chart', FundChart)
  Vue.component('fund-holdings', FundHoldings)
  Vue.component('funds-table', FundsTable)
  Vue.component('tip-of-the-day', TipOfTheDay)
}
