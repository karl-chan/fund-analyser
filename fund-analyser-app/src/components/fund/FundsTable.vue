<template lang="pug">
  .column.gutter-y-sm
    // toolbar
    .row.justify-between.items-center.gutter-x-md(:class="{invisible: !dataReady}")
      div
        fund-search(placeholder="Filter table" @input="filterText" @select="filterFund")
      .row.justify-end.items-center.gutter-x-md
        div As of: {{ $utils.format.formatDateLong(asof) }}
        div
          q-btn-group
            q-btn(color="tertiary" icon="refresh" @click="startDownload" :outline="true")
              q-tooltip Refresh dataset
            q-btn(color="tertiary" icon="fas fa-file-excel" @click="exportCsv")
              q-tooltip Export to CSV
            q-btn(color="tertiary" :icon="pinnedRowsVisible? 'expand_less': 'expand_more'" @click="togglePinnedRows")
              q-tooltip {{ pinnedRowsVisible ? 'Hide' : 'Show' }} statistics

    // actual table
    .relative-position
      ag-grid-vue.ag-theme-balham.full-width(:columnDefs="columnDefs" :rowData="summary || []"
                  :gridReady="onGridReady" :rowDoubleClicked="onRowDoubleClicked"
                  style="height: 500px" :gridOptions="gridOptions")
      div.absolute-top-left.light-dimmed.fit(v-if="!dataReady || downloading")
        q-btn.absolute-center.z-max(:loading="downloading" :percentage="downloadPercentage" @click="startDownload"
                  color="secondary" size="xl" icon="file_download")

</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'FundsTable',
  data () {
    return {
      downloading: false,
      downloadPercentage: 0,
      pinnedRowsVisible: false,
      columnDefs: [
        { headerName: 'ISIN', field: 'isin', width: 120 },
        { headerName: 'Name', field: 'name', width: 180 },
        { headerName: '5Y', field: 'returns.5Y', width: 65 },
        { headerName: '3Y', field: 'returns.3Y', width: 65 },
        { headerName: '1Y', field: 'returns.1Y', width: 65 },
        { headerName: '6M', field: 'returns.6M', width: 65 },
        { headerName: '3M', field: 'returns.3M', width: 65 },
        { headerName: '1M', field: 'returns.1M', width: 65 },
        { headerName: '2W', field: 'returns.2W', width: 65 },
        { headerName: '1W', field: 'returns.1W', width: 65 },
        { headerName: '3D', field: 'returns.3D', width: 65 },
        { headerName: '1D', field: 'returns.1D', sort: 'desc', width: 65 },
        { headerName: 'Type', field: 'type', width: 50, headerTooltip: 'Type' },
        { headerName: 'Share Class', field: 'shareClass', width: 50, headerTooltip: 'Share Class' },
        { headerName: 'Bid-Ask Spread', field: 'bidAskSpread', width: 65, headerTooltip: 'Bid Ask Spread' },
        { headerName: 'Frequency', field: 'frequency', width: 60, headerTooltip: 'Frequency' },
        { headerName: 'OCF', field: 'ocf', width: 65, headerTooltip: 'OCF' },
        { headerName: 'AMC', field: 'amc', width: 65, headerTooltip: 'AMC' },
        { headerName: 'Entry Charge', field: 'entryCharge', width: 65, headerTooltip: 'Entry Charge' },
        { headerName: 'Exit Charge', field: 'exitCharge', width: 65, headerTooltip: 'Exit Charge' },
        { headerName: 'Stability', field: 'stability', width: 50, headerTooltip: 'Stability' },
        { headerName: 'Holdings', field: 'holdings', valueFormatter: this.jsonFormatter },
        { headerName: 'As of date', field: 'asof', valueFormatter: this.dateFormatter }
      ],
      gridOptions: {
        cacheQuickFilter: true,
        enableColResize: true,
        enableFilter: true,
        enableRangeSelection: true,
        enableSorting: true,
        suppressLoadingOverlay: true,
        suppressNoRowsOverlay: true,
        toolPanelSuppressSideButtons: true,
        rowStyle: {
          cursor: 'pointer'
        },
        getRowClass: function (params) {
          if (params.node.rowPinned) {
            return ['text-bold', 'bg-dark', 'text-white']
          }
        }
      }
    }
  },
  computed: {
    summary: function () {
      const rawSummary = this.$store.state.funds.summary
      return this.$utils.fund.enrichSummary(rawSummary)
    },
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
    },
    pinnedRowsData: function () {
      if (!this.dataReady) {
        return []
      }
      const { meanReturns, medianReturns, stddevReturns } = this.$utils.fund.calcSummaryStats(this.summary)
      return [
        {isin: 'Mean returns', returns: meanReturns},
        {isin: 'Median returns', returns: medianReturns},
        {isin: 'Stddev returns', returns: stddevReturns}
      ]
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
    },
    filterText (text) {
      this.gridOptions.api.setQuickFilter(text)
    },
    filterFund (fund) {
      this.filterText(fund.isin)
    },
    onGridReady (params) {
      this.updateColDefs(params)
    },
    onRowDoubleClicked (params) {
      const isin = params.data.isin
      this.$router.push({ name: 'fund', params: { isin } })
    },
    updateColDefs (params) {
      const returnsFields = new Set(['returns.5Y', 'returns.3Y', 'returns.1Y', 'returns.6M', 'returns.3M',
        'returns.1M', 'returns.2W', 'returns.1W', 'returns.3D', 'returns.1D'])
      const percentFields = new Set(['returns.5Y', 'returns.3Y', 'returns.1Y', 'returns.6M', 'returns.3M',
        'returns.1M', 'returns.2W', 'returns.1W', 'returns.3D', 'returns.1D',
        'bidAskSpread', 'ocf', 'amc', 'entryCharge', 'exitCharge'])
      const numberFields = new Set(['stability'])
      const newColDefs = params.columnApi.getAllColumns().map(col => {
        const colDef = col.getColDef()
        if (returnsFields.has(colDef.field)) {
          colDef.cellStyle = this.colourReturnsCell
        }
        if (percentFields.has(colDef.field)) {
          colDef.valueFormatter = this.percentFormatter
          colDef.comparator = this.numberComparator
        }
        if (numberFields.has(colDef.field)) {
          colDef.valueFormatter = this.numberFormatter
          colDef.comparator = this.numberComparator
        }
        return colDef
      })
      params.api.setColumnDefs(newColDefs)
    },
    showPinnedRows () {
      this.gridOptions.api.setPinnedTopRowData(this.pinnedRowsData)
      this.pinnedRowsVisible = true
    },
    hidePinnedRows () {
      this.gridOptions.api.setPinnedTopRowData([])
      this.pinnedRowsVisible = false
    },
    togglePinnedRows () {
      this.pinnedRowsVisible ? this.hidePinnedRows() : this.showPinnedRows()
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
    colourReturnsCell (params) {
      const period = params.colDef.headerName
      if (params.data.metadata) {
        const score = params.data.metadata.scores[period]
        return this.$utils.format.colourNumberCell(score)
      }
      return undefined
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
        },
        shouldRowBeSkipped (params) {
          return params.node.rowPinned
        }
      }
      this.gridOptions.api.exportDataAsCsv(params)
    }
  }
}
</script>
