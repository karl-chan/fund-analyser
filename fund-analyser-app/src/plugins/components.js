import Highcharts from 'vue2-highcharts'
import FundSearch from 'components/fund/FundSearch'
import FundChart from 'components/fund/FundChart'
import FundHoldings from 'components/fund/FundHoldings'

export default ({ Vue }) => {
  Vue.component('highcharts', Highcharts)
  Vue.component('fund-search', FundSearch)
  Vue.component('fund-chart', FundChart)
  Vue.component('fund-holdings', FundHoldings)
}
