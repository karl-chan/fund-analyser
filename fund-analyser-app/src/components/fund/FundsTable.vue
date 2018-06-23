<template lang="pug">
  .relative-position
    ag-grid-vue.ag-theme-balham.full-width(:columnDefs="columnDefs" :rowData="enrichedFunds || []"
                :gridReady="onGridReady" :rowDoubleClicked="onRowDoubleClicked"
                :getContextMenuItems="getContextMenuItems" :gridOptions="gridOptions"
                :style="{height}" :gridAutoHeight="!height")

    .absolute-top-left.light-dimmed.fit(v-if="showEmptyView")
      // transclude empty view here
      slot(name="empty-view")

</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'FundsTable',
  props: ['funds', 'filterText', 'showPinnedRows', 'showEmptyView', 'height'],
  data () {
    return {
      columnDefs: [
        { headerName: '', cellRendererFramework: 'WarningComponent', width: 30, valueGetter: this.numDaysOutdated },
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
        { headerName: '+1D', field: 'realTimeDetails.estChange', width: 65 },
        { headerName: 'Type', field: 'type', width: 70 },
        { headerName: 'Share Class', field: 'shareClass', width: 60 },
        { headerName: 'Bid-Ask Spread', field: 'bidAskSpread', width: 70 },
        { headerName: 'Freq', field: 'frequency', width: 80 },
        { headerName: 'OCF', field: 'ocf', width: 70 },
        { headerName: 'AMC', field: 'amc', width: 70 },
        { headerName: 'Entry Charge', field: 'entryCharge', width: 80 },
        { headerName: 'Exit Charge', field: 'exitCharge', width: 80 },
        { headerName: 'Stability', field: 'stability', width: 90 },
        { headerName: 'Holdings', field: 'holdings', valueFormatter: this.jsonFormatter },
        { headerName: 'As of date', field: 'asof', valueFormatter: this.dateFormatter, width: 100 }
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
        rowSelection: 'multiple',
        popupParent: document.body,
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
  components: {
    WarningComponent: {
      template: `<q-icon v-if="params.value" :class="params.value > 1? 'text-red': 'text-amber'" name="warning" :title="'This fund may not be up-to-date (lag=' + params.value + ')'"/>`
    }
  },
  computed: {
    ...mapState('funds', ['favouriteIsins']),
    enrichedFunds: function () {
      return this.$utils.fund.enrichScores(this.funds)
    },
    pinnedRowsData: function () {
      if (!this.funds || !this.funds.length) {
        return []
      }
      const { meanReturns, medianReturns, stddevReturns } = this.$utils.fund.calcStats(this.funds)
      return [
        {isin: 'Mean returns', returns: meanReturns},
        {isin: 'Median returns', returns: medianReturns},
        {isin: 'Stddev returns', returns: stddevReturns}
      ]
    }
  },
  methods: {
    ...mapActions('funds', ['addFavouriteIsin', 'removeFavouriteIsin']),
    onGridReady (params) {
      this.updateColDefs(params)
    },
    onRowDoubleClicked (params) {
      this.$utils.router.redirectToFund(params.data.isin, {newTab: true})
    },
    getContextMenuItems (params) {
      const isin = params.node.data.isin
      const isFavourite = this.favouriteIsins.includes(isin)
      return [
        {
          name: 'Add to favourites',
          icon: '<i class="q-icon material-icons text-amber" style="font-size:15px" aria-hidden="true">star</i>',
          action: () => {
            setTimeout(() => this.addFavouriteIsin(isin), 100)
          },
          disabled: isFavourite
        },
        {
          name: 'Remove from favourites',
          icon: '<i class="q-icon material-icons text-dark" style="font-size:15px" aria-hidden="true">star_border</i>',
          action: () => {
            setTimeout(() => this.removeFavouriteIsin(isin), 100)
          },
          disabled: !isFavourite
        },
        'separator',
        ...params.defaultItems
      ]
    },
    updateColDefs (params) {
      const returnsFields = new Set(['returns.5Y', 'returns.3Y', 'returns.1Y', 'returns.6M', 'returns.3M',
        'returns.1M', 'returns.2W', 'returns.1W', 'returns.3D', 'returns.1D', 'realTimeDetails.estChange'])
      const percentFields = new Set(['returns.5Y', 'returns.3Y', 'returns.1Y', 'returns.6M', 'returns.3M',
        'returns.1M', 'returns.2W', 'returns.1W', 'returns.3D', 'returns.1D', 'realTimeDetails.estChange',
        'bidAskSpread', 'ocf', 'amc', 'entryCharge', 'exitCharge'])
      const numberFields = new Set(['stability'])
      const dateFields = new Set(['asof'])
      const newColDefs = params.columnApi.getAllColumns().map(col => {
        const colDef = col.getColDef()
        if (returnsFields.has(colDef.field)) {
          colDef.cellStyle = this.colourReturnsCellStyler
          colDef.filter = 'agNumberColumnFilter'
        }
        if (percentFields.has(colDef.field)) {
          colDef.valueFormatter = this.percentFormatter
          colDef.comparator = this.numberComparator
          colDef.filter = 'agNumberColumnFilter'
        }
        if (numberFields.has(colDef.field)) {
          colDef.valueFormatter = this.numberFormatter
          colDef.comparator = this.numberComparator
          colDef.filter = 'agNumberColumnFilter'
        }
        if (dateFields.has(colDef.field)) {
          colDef.filter = 'agDateColumnFilter'
        }
        colDef.headerTooltip = colDef.headerName
        return colDef
      })
      params.api.setColumnDefs(newColDefs)
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
    colourReturnsCellStyler (params) {
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
    numDaysOutdated (params) {
      return this.$utils.date.diffBusinessDays(new Date(), params.data.asof)
    },
    togglePinnedRows () {
      this.gridOptions.api.setPinnedTopRowData(this.showPinnedRows ? this.pinnedRowsData : [])
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
  },
  watch: {
    showPinnedRows: function () {
      this.togglePinnedRows()
    },
    pinnedRowsData: function () {
      this.togglePinnedRows()
    },
    filterText: function (text) {
      this.gridOptions.api.setQuickFilter(text)
    }
  }
}
</script>
