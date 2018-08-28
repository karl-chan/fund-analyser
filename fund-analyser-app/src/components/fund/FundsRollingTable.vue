<template lang="pug">
  .relative-position
    ag-grid-vue.ag-theme-balham.full-width(:columnDefs="columnDefs"
                :gridReady="onGridReady" :rowDoubleClicked="onRowDoubleClicked"
                :getContextMenuItems="getContextMenuItems" :gridOptions="gridOptions"
                :style="{height}" :gridAutoHeight="!height" :rowClicked="onRowSelected"
                :cacheBlockSize="window")

    .absolute-top-left.light-dimmed.fit(v-if="showEmptyView")
      // transclude empty view here
      slot(name="empty-view")

</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'FundsRollingTable',
  props: {
    isins: { type: Array },
    height: String, // null for autoheight
    window: { type: Number, default: 200 },
    filterText: { type: String, default: '' },
    showPinnedRows: Boolean,
    highlightIsin: Boolean,
    rowSelectedHandler: Function
  },
  data () {
    return {
      funds: [],
      stast: {},
      showEmptyView: false,
      columnDefs: [
        { headerName: '', cellRendererFramework: 'WarningComponent', width: 30, valueGetter: this.numDaysOutdated },
        { headerName: 'ISIN', field: 'isin', width: 120 },
        { headerName: 'Name', field: 'name', width: 180, tooltipField: 'name' },
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
        { headerName: '+1D', field: 'returns.+1D', width: 65 },
        { headerName: 'Type', field: 'type', width: 70 },
        { headerName: 'Share Class', field: 'shareClass', width: 60 },
        { headerName: 'Bid-Ask Spread', field: 'bidAskSpread', width: 70 },
        { headerName: 'Freq', field: 'frequency', width: 80 },
        { headerName: 'OCF', field: 'ocf', width: 70 },
        { headerName: 'AMC', field: 'amc', width: 70 },
        { headerName: 'Entry Charge', field: 'entryCharge', width: 80 },
        { headerName: 'Exit Charge', field: 'exitCharge', width: 80 },
        { headerName: 'Stability', field: 'indicators.stability', width: 90 },
        { headerName: 'Holdings', field: 'holdings', valueFormatter: this.jsonFormatter },
        { headerName: 'As of date', field: 'asof', valueFormatter: this.dateFormatter, width: 100 }
      ],
      gridOptions: {
        context: this,
        enableColResize: true,
        enableFilter: true,
        enableServerSideSorting: true,
        enableServerSideFiltering: true,
        enableRangeSelection: true,
        suppressLoadingOverlay: true,
        suppressNoRowsOverlay: true,
        toolPanelSuppressSideButtons: true,
        toolPanelSuppressPivotMode: true,
        toolPanelSuppressRowGroups: true,
        toolPanelSuppressValues: true,
        rowSelection: 'multiple',
        popupParent: document.body,
        rowModelType: 'serverSide',
        rowStyle: {
          cursor: 'pointer'
        },
        getRowClass: function (params) {
          let classes = []
          if (params.node.rowPinned) {
            const pinnedClasses = ['text-bold', 'bg-dark', 'text-white']
            classes = [...classes, ...pinnedClasses]
          }
          // if (params.data.isin === params.context.highlightIsin) {
          //   const highlightClasses = ['bg-yellow']
          //   classes = [...classes, ...highlightClasses]
          // }
          return classes
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
    ...mapState('account', ['watchlist']),
    pinnedRowsData: function () {
      const { maxReturns, minReturns, medianReturns } = this.stats
      return maxReturns && minReturns && medianReturns
        ? [
          {isin: 'Max returns', returns: maxReturns},
          {isin: 'Median returns', returns: medianReturns},
          {isin: 'Min returns', returns: minReturns}
        ]
        : []
    }
  },
  methods: {
    ...mapActions('account', ['addToWatchlist', 'removeFromWatchlist']),
    onGridReady (params) {
      this.updateColDefs(params)
      this.initDataSource()
    },
    onRowsChanged (metadata) {
      this.showEmptyView = !metadata.lastRow > 0
      this.stats = metadata.stats
      this.$emit('rowsChanged', metadata)
    },
    onRowSelected (params) {
      if (this.rowSelectedHandler) {
        this.rowSelectedHandler(params)
      }
    },
    onRowDoubleClicked (params) {
      const notApplicable = this.isRowPinned(params)
      if (notApplicable) {
        return
      }
      this.$utils.router.redirectToFund(params.data.isin, {newTab: true})
    },
    getContextMenuItems (params) {
      let contextMenu = params.defaultItems

      const filterContextMenuItems = [
        {
          name: 'Reset all Filters',
          action: () => {
            params.context.resetFilters()
          }
        }
      ]
      contextMenu = [...filterContextMenuItems, 'separator', ...contextMenu]

      if (!this.isRowPinned(params)) {
        // row is fund
        const isin = params.node.data.isin
        const isFavourite = this.watchlist.includes(isin)
        const fundContextMenuItems = [
          {
            name: 'Add to watch list',
            icon: '<i class="q-icon material-icons text-amber" style="font-size:15px" aria-hidden="true">star</i>',
            action: () => {
              params.context.addToWatchlist(isin)
            },
            disabled: isFavourite
          },
          {
            name: 'Remove from watch list',
            icon: '<i class="q-icon material-icons text-dark" style="font-size:15px" aria-hidden="true">star_border</i>',
            action: () => {
              params.context.removeFromWatchlist(isin)
            },
            disabled: !isFavourite
          }
        ]
        contextMenu = [...fundContextMenuItems, 'separator', ...contextMenu]
      }
      return contextMenu
    },
    updateColDefs (params) {
      const returnsFields = new Set(['returns.5Y', 'returns.3Y', 'returns.1Y', 'returns.6M', 'returns.3M',
        'returns.1M', 'returns.2W', 'returns.1W', 'returns.3D', 'returns.1D', 'returns.+1D'])
      const percentFields = new Set(['returns.5Y', 'returns.3Y', 'returns.1Y', 'returns.6M', 'returns.3M',
        'returns.1M', 'returns.2W', 'returns.1W', 'returns.3D', 'returns.1D', 'returns.+1D',
        'bidAskSpread', 'ocf', 'amc', 'entryCharge', 'exitCharge'])
      const numberFields = new Set(['indicators.stability'])
      const dateFields = new Set(['asof'])
      const newColDefs = params.columnApi.getAllColumns().map(col => {
        const colDef = col.getColDef()
        if (returnsFields.has(colDef.field)) {
          colDef.cellStyle = this.colourReturnsCellStyler
          colDef.filter = 'agNumberColumnFilter'
          colDef.filterParams = {newRowsAction: 'keep', apply: true}
        }
        if (percentFields.has(colDef.field)) {
          colDef.valueFormatter = this.percentFormatter
          colDef.comparator = this.numberComparator
          colDef.filter = 'agNumberColumnFilter'
          colDef.filterParams = {newRowsAction: 'keep', apply: true}
        }
        if (numberFields.has(colDef.field)) {
          colDef.valueFormatter = this.numberFormatter
          colDef.comparator = this.numberComparator
          colDef.filter = 'agNumberColumnFilter'
          colDef.filterParams = {newRowsAction: 'keep', apply: true}
        }
        if (dateFields.has(colDef.field)) {
          colDef.filter = 'agDateColumnFilter'
          colDef.filterParams = {newRowsAction: 'keep', apply: true}
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
      if (params.data.scores) {
        const score = params.data.scores[period]
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
    resetFilters () {
      this.gridOptions.api.setFilterModel(null)
    },
    togglePinnedRows () {
      this.gridOptions.api.setPinnedTopRowData(this.showPinnedRows ? this.pinnedRowsData : [])
    },
    isRowPinned (params) {
      return params.node.rowPinned
    },
    initDataSource () {
      const self = this
      this.gridOptions.api.setServerSideDatasource({
        getRows: async params => {
          try {
            const {funds, metadata} = await self.$services.fund.list(this.isins, {
              agGridRequest: params.request,
              filterText: this.filterText
            })

            this.onRowsChanged(metadata)
            if (metadata.lastRow) {
              params.successCallback(funds, metadata.lastRow)
              this.showEmptyView = false
              return
            }
          } catch (err) {
            params.failCallback()
          }
          this.showEmptyView = true
        }
      })
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
        shouldRowBeSkipped: this.isRowPinned
      }
      this.gridOptions.api.exportDataAsCsv(params)
    }
  },
  watch: {
    isins: function () {
      this.$services.fund.list()
    },
    showPinnedRows: function () {
      this.togglePinnedRows()
    },
    pinnedRowsData: function () {
      this.togglePinnedRows()
    },
    filterText: function (text) {
      this.initDataSource()
    },
    highlightIsin: function (isin) {
      this.gridOptions.api.redrawRows()
    }
  }
}
</script>
