import Highcharts from 'vue2-highcharts'
import FundSearch from 'components/fund/FundSearch'
import FundInfoBar from 'components/fund/FundInfoBar'
import FundChart from 'components/fund/FundChart'
import FundHoldings from 'components/fund/FundHoldings'
import FundsTable from 'components/fund/FundsTable'

export default ({ Vue }) => {
  Vue.component('highcharts', Highcharts)
  Vue.component('fund-search', FundSearch)
  Vue.component('fund-info-bar', FundInfoBar)
  Vue.component('fund-chart', FundChart)
  Vue.component('fund-holdings', FundHoldings)
  Vue.component('funds-table', FundsTable)
}
