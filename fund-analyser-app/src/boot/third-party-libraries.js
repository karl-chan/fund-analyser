import { LicenseManager } from 'ag-grid-enterprise'
import { AgGridVue } from 'ag-grid-vue3'
import Highcharts from 'highcharts'
import HighchartsVue from 'highcharts-vue'
import mapInit from 'highcharts/modules/map'
import stockInit from 'highcharts/modules/stock'
import Vuelidate from 'vuelidate'

stockInit(Highcharts)
mapInit(Highcharts)

LicenseManager.prototype.validateLicense = () => {}

export default ({ app }) => {
  app.component('ag-grid-vue', AgGridVue)
  app.use(HighchartsVue)
  app.use(Vuelidate)
}
