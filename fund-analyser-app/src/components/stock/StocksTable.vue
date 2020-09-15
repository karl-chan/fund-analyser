<template lang="pug">
  .column.q-gutter-y-xs
    // transclude title on the left
    .row.justify-between.items-end.q-gutter-x-md
      slot(name="title")

      // mini-toolbar (num up to date / refresh / csv export / statistics)
      .row.items-center
        div As of: {{ $utils.format.formatDateLong(asofDate) }}
        q-btn(icon="info" color="primary" flat rounded dense)
          q-tooltip
            .q-mb-sm.text-subtitle1
              <b>{{ pctUpToDate }}</b> up to date
            | {{ numUpToDate }} out of {{ totalStocks }} stocks
        q-btn-group.q-ml-md
          q-btn(color="accent" icon="refresh" @click="refresh")
            q-tooltip Refresh data
          q-btn(color="accent" icon="fas fa-file-excel" @click="exportCsv")
            q-tooltip Export to CSV
          q-btn(color="accent" :icon="showStatMode <= 1 ? 'expand_more' : 'expand_less'" @click="toggleStatMode")
            q-tooltip {{ showStatMode <= 1 ? 'Show' : 'Hide' }} statistics

    .relative-position.q-mt-sm
      ag-grid-vue.ag-theme-balham.full-width(:columnDefs="columnDefs"
                  @grid-ready="onGridReady" @rowDoubleClicked="onRowDoubleClicked" @rowClicked="onRowSelected"
                  :getContextMenuItems="getContextMenuItems" :gridOptions="gridOptions"
                  :style="{height}" :domLayout="height ? 'normal': 'autoHeight'"
                  :cacheBlockSize="window")

      .absolute-top-left.light-dimmed.fit(v-if="showEmptyView")
        // transclude empty view here
        slot(name="empty-view")

</template>

<script>
import { mapState } from 'vuex'
import get from 'lodash/get'

const periods = ['5Y', '3Y', '1Y', '6M', '3M', '1M', '2W', '1W', '3D', '1D']
const extendedPeriods = periods.concat('+1D')

export default {
  name: 'StocksTable',
  props: {
    symbols: { type: Array },
    height: String, // null for autoheight
    window: { type: Number, default: 200 },
    filterText: { type: String, default: '' },
    highlightSymbol: String,
    showUpToDateOnly: { type: Boolean, default: false }
  },
  data () {
    return {
      stocks: [],
      stats: {},
      showEmptyView: false,
      asofDate: null,
      numUpToDate: 0,
      totalStocks: 0,
      showStatMode: 0, // hidden
      gridOptions: {
        context: this,
        defaultColDef: {
          filter: true,
          resizable: true,
          sortable: true
        },
        enableRangeSelection: true,
        suppressLoadingOverlay: true,
        suppressNoRowsOverlay: true,
        sideBar: {
          toolPanels: [
            {
              id: 'columns',
              labelDefault: 'Columns',
              labelKey: 'columns',
              iconKey: 'columns',
              toolPanel: 'agColumnsToolPanel',
              toolPanelParams: {
                suppressRowGroups: true,
                suppressValues: true,
                suppressPivots: true,
                suppressPivotMode: true
              }
            },
            'filters'
          ]
        },
        rowSelection: 'multiple',
        popupParent: document.body,
        rowModelType: 'serverSide',
        rowStyle: {
          cursor: 'pointer'
        },
        getRowClass: function (params) {
          let classes = []
          if (params.node.rowPinned) {
            const pinnedClasses = ['text-bold', 'bg-accent', 'text-white']
            classes = [...classes, ...pinnedClasses]
          }
          return classes
        }
      },
      gridApi: undefined,
      columnApi: undefined
    }
  },
  components: {
    WarningComponent: {
      template: '<q-icon v-if="params.value" :class="params.value > 1? \'text-red\': \'text-amber\'" name="warning" :title="\'This stock may not be up-to-date (lag=\' + params.value + \')\'"/>'
    }
  },
  computed: {
    // ...mapState('account', ['stockWatchlist']),
    ...mapState('stocks', ['indicatorSchema']),
    pctUpToDate: function () {
      return this.$utils.format.formatPercentage(this.numUpToDate / this.totalStocks, '0%')
    },
    columnDefs: function () {
      const colDefs = [
        { headerName: '', cellRendererFramework: 'WarningComponent', width: 30, valueGetter: this.numDaysOutdated, pinned: 'left' },
        { headerName: 'Symbol', field: 'symbol', width: 70, pinned: 'left' },
        { headerName: 'Name', field: 'name', width: 180, pinned: 'left', tooltipValueGetter: params => params.value },
        {
          headerName: 'Returns',
          marryChildren: true,
          children: extendedPeriods.map(period => ({
            headerName: period, field: `returns.${period}`, width: 65, sort: period === '1D' && 'desc'
          }))
        },
        {
          headerName: 'Indicators',
          marryChildren: true,
          children: Object.entries(this.indicatorSchema).map(([key, { name }]) => {
            return {
              headerName: name,
              field: `indicators.${key}.value`,
              width: 75,
              tooltipValueGetter: params => this.indicatorMetadataFormatter(params, key)
            }
          })
        },
        { headerName: 'As of date', field: 'asof', valueFormatter: this.dateFormatter, width: 100 }
      ]

      const colourFields = new Set(
        extendedPeriods.map(period => `returns.${period}`)
          .concat(this.getIndicatorKeys()))
      const percentFields = new Set(
        []
          .concat(extendedPeriods.map(period => `returns.${period}`))
          .concat(this.getIndicatorKeys('percent')))
      const numberFields = new Set(this.getIndicatorKeys('default'))
      const dateFields = new Set(['asof'])

      const updateColDef = colDef => {
        const apply = colDef => {
          if (colourFields.has(colDef.field)) {
            colDef.cellStyle = this.colourCellStyler
            colDef.filter = 'agNumberColumnFilter'
            colDef.filterParams = { newRowsAction: 'keep', apply: true }
          }
          if (percentFields.has(colDef.field)) {
            colDef.valueFormatter = this.percentFormatter
            colDef.comparator = this.numberComparator
            colDef.filter = 'agNumberColumnFilter'
            colDef.filterParams = { newRowsAction: 'keep', apply: true }
          }
          if (numberFields.has(colDef.field)) {
            colDef.valueFormatter = this.numberFormatter
            colDef.comparator = this.numberComparator
            colDef.filter = 'agNumberColumnFilter'
            colDef.filterParams = { newRowsAction: 'keep', apply: true }
          }
          if (dateFields.has(colDef.field)) {
            colDef.filter = 'agDateColumnFilter'
            colDef.filterParams = { newRowsAction: 'keep', apply: true }
          }
          colDef.headerTooltip = colDef.headerName
        }
        // recursively apply to children
        apply(colDef)
        if (colDef.children) {
          colDef.children.forEach(apply)
        }
      }
      colDefs.forEach(updateColDef)
      return colDefs
    }
  },
  methods: {
    // ...mapActions('account', ['addToStockWatchlist', 'removeFromStockWatchlist']),
    onGridReady (params) {
      this.gridApi = params.api
      this.columnApi = params.columnApi
      this.initDataSource()
    },
    onRowsChanged (metadata) {
      this.showEmptyView = !metadata.lastRow > 0
      this.stats = metadata.stats
      this.asofDate = metadata.asof.date
      this.numUpToDate = metadata.asof.numUpToDate
      this.totalStocks = metadata.totalStocks
    },
    onRowSelected (params) {
      this.$emit('rowSelected', params)
    },
    onRowDoubleClicked (params) {
      const notApplicable = this.isRowPinned(params)
      if (notApplicable) {
        return
      }
      this.$utils.router.redirectToStock(params.data.symbol, { newTab: true })
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

      // if (!this.isRowPinned(params)) {
      // row is stock
      // const symbol = params.node.data.symbol
      // const isFavourite = this.stockWatchlist.includes(symbol)
      // const stockContextMenuItems = isFavourite
      //   ? [{
      //     name: 'Remove from watch list',
      //     icon: '<i class="q-icon material-icons text-accent" style="font-size:15px" aria-hidden="true">star_border</i>',
      //     action: () => {
      //       params.context.removeFromStockWatchlist(symbol)
      //     }
      //   }]
      //   : [{
      //     name: 'Add to watch list',
      //     icon: '<i class="q-icon material-icons text-amber" style="font-size:15px" aria-hidden="true">star</i>',
      //     action: () => {
      //       params.context.addToStockWatchlist(symbol)
      //     }
      //   }]
      // contextMenu = [...stockContextMenuItems, 'separator', ...contextMenu]
      // }
      return contextMenu
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
    indicatorMetadataFormatter (params, key) {
      const metadata = get(params.data, `indicators.${key}.metadata`)
      return metadata ? JSON.stringify(metadata) : undefined
    },
    colourNumberStyler (params) {
      return this.$utils.format.colourNumber(params.value)
    },
    colourCellStyler (params) {
      if (params.data.colours) {
        const score = get(params.data.colours, params.colDef.field)
        return this.$utils.format.colourNumberCell(score)
      }
      return undefined
    },
    numberComparator (a, b) {
      return this.$utils.number.numberComparator(a, b)
    },
    numDaysOutdated (params) {
      return !this.isRowPinned(params) && this.$utils.date.diffBusinessDays(new Date(), params.data.asof)
    },
    resetFilters () {
      this.gridApi.setFilterModel(null)
    },
    togglePinnedRows () {
      let pinnedRows = []
      if (this.stats) {
        const { min, q1, median, q3, max } = this.stats
        switch (this.showStatMode) {
          case 1:
            pinnedRows = [
              { symbol: 'Max', ...max },
              { symbol: 'Median', ...median },
              { symbol: 'Min', ...min }
            ]
            break
          case 2:
            pinnedRows = [
              { symbol: 'Max', ...max },
              { symbol: 'Q3', ...q3 },
              { symbol: 'Median', ...median },
              { symbol: 'Q1', ...q1 },
              { symbol: 'Min', ...min }
            ]
            break
        }
      }
      setTimeout(() => this.gridApi.setPinnedTopRowData(pinnedRows), 0)
    },
    isRowPinned (params) {
      return params.node.rowPinned
    },
    initDataSource () {
      const self = this
      this.gridApi.setServerSideDatasource({
        getRows: async params => {
          try {
            const { stocks, metadata } = await self.$services.stock.list(this.symbols, {
              agGridRequest: params.request,
              filterText: this.filterText,
              showUpToDateOnly: this.showUpToDateOnly
            })

            this.onRowsChanged(metadata)
            if (metadata.lastRow) {
              params.successCallback(stocks, metadata.lastRow)
              this.showEmptyView = false
              return
            }
          } catch (err) {
            console.error(err)
            params.failCallback()
          }
          this.showEmptyView = true
        }
      })
    },
    refresh () {
      this.resetFilters()
      this.initDataSource()
    },
    exportCsv () {
      const params = {
        fileName: this.$utils.format.formatDateShort(new Date()),
        processCellCallback: params => {
          switch (params.column.colId) {
            case 'returns.5Y':
            case 'returns.3Y':
            case 'returns.1Y':
            case 'returns.6M':
            case 'returns.3M':
            case 'returns.1M':
            case 'returns.2W':
            case 'returns.1W':
            case 'returns.3D':
            case 'returns.1D': return this.percentFormatter(params, '')
            default: return params.value
          }
        },
        shouldRowBeSkipped: this.isRowPinned
      }
      this.gridApi.exportDataAsCsv(params)
    },
    toggleStatMode () {
      this.showStatMode = (this.showStatMode + 1) % 3
    },
    getIndicatorKeys (format) {
      let keys = Object.keys(this.indicatorSchema)
      if (format) {
        keys = keys.filter(key => this.indicatorSchema[key].format === format)
      }
      return keys.map(key => `indicators.${key}.value`)
    }
  },
  watch: {
    symbols: function () {
      this.initDataSource()
    },
    showStatMode: function () {
      this.togglePinnedRows()
    },
    stats: function () {
      this.togglePinnedRows()
    },
    filterText: function () {
      this.initDataSource()
    },
    showUpToDateOnly: function () {
      this.initDataSource()
    },
    highlightSymbol: function (symbol) {
      this.gridApi.forEachNode(node => {
        node.setSelected(node.data.symbol === symbol)
      })
    }
  }
}
</script>
