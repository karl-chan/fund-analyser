import { LicenseManager } from 'ag-grid-enterprise'
import { AgGridVue } from 'ag-grid-vue'
import Highcharts from 'highcharts'
import mapInit from 'highcharts/modules/map'
import stockInit from 'highcharts/modules/stock'
import HighchartsVue from 'highcharts-vue'
import Vuelidate from 'vuelidate'

stockInit(Highcharts)
mapInit(Highcharts)

LicenseManager.prototype.validateLicense = () => {}

export default ({ Vue }) => {
  Vue.component('ag-grid-vue', AgGridVue)
  Vue.use(HighchartsVue)
  Vue.use(Vuelidate)
}
