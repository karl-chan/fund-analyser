import { AgGridVue } from 'ag-grid-vue'
import 'ag-grid-enterprise/main'

import VueHighcharts from 'vue-highcharts'
import Highcharts from 'highcharts'
import Highstock from 'highcharts/modules/stock'
import Highmaps from 'highcharts/modules/map'
Highstock(Highcharts)
Highmaps(Highcharts)

import Vuelidate from 'vuelidate'

export default ({ Vue }) => {
  Vue.component('ag-grid-vue', AgGridVue)
  Vue.use(VueHighcharts, { Highcharts })
  Vue.use(Vuelidate)
}
