import { AgGridVue } from 'ag-grid-vue'
import 'ag-grid-enterprise/main'
import VueHighcharts from 'vue-highcharts'
import Highcharts from 'highcharts'
import Highstock from 'highcharts/modules/stock'
import Highmaps from 'highcharts/modules/map'

import FundSearch from 'components/fund/FundSearch'
import FundInfoBar from 'components/fund/FundInfoBar'
import FundChart from 'components/fund/FundChart'
import FundHoldings from 'components/fund/FundHoldings'
import FundsTable from 'components/fund/FundsTable'

import TipOfTheDay from 'components/misc/TipOfTheDay'

Highstock(Highcharts)
Highmaps(Highcharts)

export default ({ Vue }) => {
  Vue.component('ag-grid-vue', AgGridVue)
  Vue.use(VueHighcharts, { Highcharts })
  Vue.component('fund-search', FundSearch)
  Vue.component('fund-info-bar', FundInfoBar)
  Vue.component('fund-chart', FundChart)
  Vue.component('fund-holdings', FundHoldings)
  Vue.component('funds-table', FundsTable)
  Vue.component('tip-of-the-day', TipOfTheDay)
}
