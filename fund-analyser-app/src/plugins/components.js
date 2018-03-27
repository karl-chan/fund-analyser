import { AgGridVue } from 'ag-grid-vue'
import 'ag-grid-enterprise/main'

import FundSearch from 'components/fund/FundSearch'
import FundInfoBar from 'components/fund/FundInfoBar'
import FundChart from 'components/fund/FundChart'
import FundHoldings from 'components/fund/FundHoldings'
import FundsTable from 'components/fund/FundsTable'

import TipOfTheDay from 'components/misc/TipOfTheDay'

export default ({ Vue }) => {
  Vue.component('ag-grid-vue', AgGridVue)
  Vue.component('fund-search', FundSearch)
  Vue.component('fund-info-bar', FundInfoBar)
  Vue.component('fund-chart', FundChart)
  Vue.component('fund-holdings', FundHoldings)
  Vue.component('funds-table', FundsTable)
  Vue.component('tip-of-the-day', TipOfTheDay)
}
