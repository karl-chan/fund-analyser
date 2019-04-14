import { LicenseManager } from 'ag-grid-enterprise'
import { AgGridVue } from 'ag-grid-vue'
import Highcharts from 'highcharts'
import Highmaps from 'highcharts/modules/map'
import Highstock from 'highcharts/modules/stock'
import VueHighcharts from 'vue-highcharts'
import Vuelidate from 'vuelidate'

Highstock(Highcharts)
Highmaps(Highcharts)

LicenseManager.prototype.validateLicense = () => {}

export default ({ Vue }) => {
  Vue.component('ag-grid-vue', AgGridVue)
  Vue.use(VueHighcharts, { Highcharts })
  Vue.use(Vuelidate)
}
