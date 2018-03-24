<template lang="pug">
  .column.gutter-y-sm
    // toolbar
    .row.justify-end.items-center.gutter-x-md(:class="{invisible: !dataReady}")
      div As of: {{ $utils.format.formatDateLong(asof) }}
      div
        q-btn-group
          q-btn(color="tertiary" icon="refresh" @click="startDownload")
          q-btn(color="tertiary" icon="fas fa-file-excel" @click="exportCsv")

    // actual table
    .relative-position
      ag-grid-vue.ag-theme-balham.full-width(:columnDefs="columnDefs" :rowData="summary || []"
                  style="height: 500px" :gridOptions="gridOptions")
      div.absolute-top-left.light-dimmed.fit(v-if="!dataReady || downloading")
        q-btn.absolute-center.z-max(:loading="downloading" :percentage="downloadPercentage" @click="startDownload"
                  color="secondary" size="xl" icon="file_download")

</template>

<script>
import { mapActions, mapState } from 'vuex'

export default {
  name: 'FundsTable',
  data () {
    return {
      downloading: false,
      downloadPercentage: 0,
      columnDefs: [
        { headerName: 'ISIN', field: 'isin', width: 120 },
        { headerName: 'Name', field: 'name', width: 180 },
        { headerName: '5Y', field: 'returns.5Y', width: 65, valueFormatter: this.percentFormatter, cellClass: this.colourNumberStyler, comparator: this.numberComparator },
        { headerName: '3Y', field: 'returns.3Y', width: 65, valueFormatter: this.percentFormatter, cellClass: this.colourNumberStyler, comparator: this.numberComparator },
        { headerName: '1Y', field: 'returns.1Y', width: 65, valueFormatter: this.percentFormatter, cellClass: this.colourNumberStyler, comparator: this.numberComparator },
        { headerName: '6M', field: 'returns.6M', width: 65, valueFormatter: this.percentFormatter, cellClass: this.colourNumberStyler, comparator: this.numberComparator },
        { headerName: '3M', field: 'returns.3M', width: 65, valueFormatter: this.percentFormatter, cellClass: this.colourNumberStyler, comparator: this.numberComparator },
        { headerName: '1M', field: 'returns.1M', width: 65, valueFormatter: this.percentFormatter, cellClass: this.colourNumberStyler, comparator: this.numberComparator },
        { headerName: '2W', field: 'returns.2W', width: 65, valueFormatter: this.percentFormatter, cellClass: this.colourNumberStyler, comparator: this.numberComparator },
        { headerName: '1W', field: 'returns.1W', width: 65, valueFormatter: this.percentFormatter, cellClass: this.colourNumberStyler, comparator: this.numberComparator },
        { headerName: '3D', field: 'returns.3D', width: 65, valueFormatter: this.percentFormatter, cellClass: this.colourNumberStyler, comparator: this.numberComparator },
        { headerName: '1D', field: 'returns.1D', sort: 'desc', width: 65, valueFormatter: this.percentFormatter, cellClass: this.colourNumberStyler, comparator: this.numberComparator },
        { headerName: 'Type', field: 'type', width: 50, headerTooltip: 'Type' },
        { headerName: 'Share Class', field: 'shareClass', width: 50, headerTooltip: 'Share Class' },
        { headerName: 'Bid-Ask Spread', field: 'bidAskSpread', width: 65, valueFormatter: this.percentFormatter, comparator: this.numberComparator, headerTooltip: 'Bid Ask Spread' },
        { headerName: 'Frequency', field: 'frequency', width: 60, headerTooltip: 'Frequency' },
        { headerName: 'OCF', field: 'ocf', width: 65, valueFormatter: this.percentFormatter, comparator: this.numberComparator, headerTooltip: 'OCF' },
        { headerName: 'AMC', field: 'amc', width: 65, valueFormatter: this.percentFormatter, comparator: this.numberComparator, headerTooltip: 'AMC' },
        { headerName: 'Entry Charge', field: 'entryCharge', width: 65, valueFormatter: this.percentFormatter, comparator: this.numberComparator, headerTooltip: 'Entry Charge' },
        { headerName: 'Exit Charge', field: 'exitCharge', width: 65, valueFormatter: this.percentFormatter, comparator: this.numberComparator, headerTooltip: 'Exit Charge' },
        { headerName: 'Stability', field: 'stability', width: 50, valueFormatter: this.numberFormatter, comparator: this.numberComparator, headerTooltip: 'Stability' },
        { headerName: 'CV', field: 'cv', width: 50, valueFormatter: this.numberFormatter, comparator: this.numberComparator, headerTooltip: 'Coefficient of Variation' },
        { headerName: 'Holdings', field: 'holdings', valueFormatter: this.jsonFormatter },
        { headerName: 'As of date', field: 'asof', valueFormatter: this.dateFormatter }
      ],
      gridOptions: {
        enableColResize: true,
        enableFilter: true,
        enableRangeSelection: true,
        enableSorting: true,
        suppressLoadingOverlay: true,
        suppressNoRowsOverlay: true,
        suppressColumnVirtualisation: true,
        toolPanelSuppressSideButtons: true,
        defaultColDef: {
          suppressMenu: true
        }
      }
    }
  },
  computed: {
    ...mapState('funds', [
      'summary'
    ]),
    dataReady: function () {
      return this.summary && this.summary.length
    },
    asof: function () {
      if (!this.dataReady) {
        return undefined
      }
      const asofs = this.summary.map(f => Date.parse(f.asof))
      const globalAsof = Math.max.apply(null, asofs.filter(isFinite))
      return new Date(globalAsof)
    }
  },
  methods: {
    ...mapActions(
      'funds', [ 'getSummary' ]
    ),
    ...mapActions(
      'layout', [ 'closeDrawer' ]
    ),
    async startDownload () {
      this.downloading = true
      await this.getSummary()
      this.downloading = false
      this.closeDrawer()
    },
    numberFormatter (params) {
      return this.$utils.format.formatNumber(params.value)
    },
    percentFormatter (params, fallbackValue) {
      return this.$utils.format.formatPercentage(params.value, true, fallbackValue)
    },
    dateFormatter (params) {
      return this.$utils.format.formatDateShort(params.value, true)
    },
    jsonFormatter (params) {
      return JSON.stringify(params.value)
    },
    colourNumberStyler (params) {
      return this.$utils.format.colourNumber(params.value)
    },
    numberComparator (a, b) {
      return this.$utils.number.numberComparator(a, b)
    },
    exportCsv () {
      const params = {
        fileName: this.$utils.format.formatDateShort(new Date()),
        processCellCallback: params => {
          switch (params.column.colId) {
            case 'holdings': return this.jsonFormatter(params)
            case 'returns.5Y':
            case 'returns.3Y':
            case 'returns.1Y':
            case 'returns.6M':
            case 'returns.3M':
            case 'returns.1M':
            case 'returns.2W':
            case 'returns.1W':
            case 'returns.3D':
            case 'returns.1D':
            case 'bidAskSpread':
            case 'ocf':
            case 'amc':
            case 'entryCharge':
            case 'exitCharge': return this.percentFormatter(params, '')
            default: return params.value
          }
        }
      }
      this.gridOptions.api.exportDataAsCsv(params)
    }
  }
}
</script>

<style>
</style>
