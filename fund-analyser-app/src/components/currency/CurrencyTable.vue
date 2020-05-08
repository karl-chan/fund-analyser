<template lang="pug">
  .column.q-gutter-y-xs
    // transclude title on the left
    .row.justify-between.items-end.q-gutter-x-md
      q-input.shadow-2(v-model="filterText" label="Filter table"
                       bg-color="grey-2" color="accent" filled clearable dense)

      // mini-toolbar (num up to date / refresh / csv export / statistics)
      .row.items-center
        div Total currencies: {{ currencies.length }}
        q-btn-group.q-ml-md
          q-btn(color="accent" icon="refresh" @click="refresh")
            q-tooltip Refresh data
          q-btn(color="accent" :icon="showStatMode <= 1 ? 'expand_more' : 'expand_less'" @click="toggleStatMode")
            q-tooltip {{ showStatMode <= 1 ? 'Show' : 'Hide' }} statistics

    .relative-position.q-mt-sm
      ag-grid-vue.ag-theme-balham.full-width(:columnDefs="columnDefs"
                  :rowData="displayedCurrencies"
                  @grid-ready="onGridReady" :gridOptions="gridOptions"
                  :getContextMenuItems="getContextMenuItems"
                  :style="{height}" :domLayout="height ? 'normal': 'autoHeight'")

      .absolute-top-left.light-dimmed.fit(v-if="showEmptyView")
        // transclude empty view here
        slot(name="empty-view")

</template>

<script>
import { mapState, mapActions } from 'vuex'
import get from 'lodash/get'

const periods = ['5Y', '3Y', '1Y', '6M', '3M', '1M', '2W', '1W', '3D', '1D']

export default {
  name: 'CurrencyTable',
  props: {
    currencies: { type: Array },
    stats: { type: Object },
    height: String // null for autoheight
  },
  data () {
    return {
      showStatMode: 0, // hidden
      filterText: '',
      columnDefs: [
        { headerName: '', cellRendererFramework: 'FavouritesComponent', width: 60, valueGetter: this.isFavourite, pinned: 'left', sort: 'desc' },
        { headerName: 'Base', field: 'base', width: 80, pinned: 'left' },
        { headerName: 'Quote', field: 'quote', width: 80, pinned: 'left' },
        {
          headerName: 'Returns',
          marryChildren: true,
          children: periods.map(period => ({
            headerName: period, field: `returns.${period}`, width: 75, sort: period === '1D' && 'desc'
          }))
        }
      ],
      gridOptions: {
        context: this,
        defaultColDef: {
          filter: true,
          resizable: true,
          sortable: true
        },
        enableRangeSelection: true,
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
        getRowClass: function (params) {
          let classes = []
          if (params.node.rowPinned) {
            const pinnedClasses = ['text-bold', 'bg-accent', 'text-white']
            classes = [...classes, ...pinnedClasses]
          }
          return classes
        }
      }
    }
  },
  components: {
    FavouritesComponent: {
      template: '<q-icon v-if="params.value" class="text-amber" name="star" size="18px"/>'
    }
  },
  computed: {
    ...mapState('account', ['favouriteCurrencies']),
    displayedCurrencies () {
      return this.currencies.filter(c => {
        const name = `${c.base}${c.quote}`
        return name.toLowerCase().includes(this.filterText.toLowerCase())
      })
    },
    showEmptyView () {
      return !this.displayedCurrencies
    }
  },
  methods: {
    ...mapActions('account', ['addToFavouriteCurrencies', 'removeFromFavouriteCurrencies']),
    ...mapActions('currency', ['getSummary']),
    onGridReady (params) {
      this.updateColDefs(params)
    },
    isFavourite (params) {
      const base = params.node.data.base
      const quote = params.node.data.quote
      const symbol = `${base}${quote}`
      return this.favouriteCurrencies.includes(symbol)
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
        // row is currency
        const base = params.node.data.base
        const quote = params.node.data.quote
        const symbol = `${base}${quote}`
        const currencyContextMenuItems = this.isFavourite(params)
          ? [{
            name: 'Remove from favourites',
            icon: '<i class="q-icon material-icons text-accent" style="font-size:15px" aria-hidden="true">star_border</i>',
            action: async () => {
              await params.context.removeFromFavouriteCurrencies(symbol)
              params.api.redrawRows()
            }
          }]
          : [{
            name: 'Add to favourites',
            icon: '<i class="q-icon material-icons text-amber" style="font-size:15px" aria-hidden="true">star</i>',
            action: async () => {
              await params.context.addToFavouriteCurrencies(symbol)
              params.api.redrawRows()
            }
          }]
        contextMenu = [...currencyContextMenuItems, 'separator', ...contextMenu]
      }
      return contextMenu
    },
    updateColDefs (params) {
      const colourFields = new Set(
        periods.map(period => `returns.${period}`))
      const percentFields = new Set(
        periods.map(period => `returns.${period}`))

      const updateColDef = col => {
        const colDef = col.getColDef()
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
        colDef.headerTooltip = colDef.headerName
        return colDef
      }

      const newColDefs = params.columnApi.getAllColumns().map(col => updateColDef(col))
      params.api.setColumnDefs(newColDefs)
    },
    percentFormatter (params, fallbackValue) {
      return this.$utils.format.formatPercentage(params.value, true, fallbackValue)
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
    resetFilters () {
      this.gridOptions.api.setFilterModel(null)
    },
    togglePinnedRows () {
      let pinnedRows = []
      if (this.stats) {
        const { min, q1, median, q3, max } = this.stats
        switch (this.showStatMode) {
          case 1:
            pinnedRows = [
              { base: 'Max', ...max },
              { base: 'Median', ...median },
              { base: 'Min', ...min }
            ]
            break
          case 2:
            pinnedRows = [
              { base: 'Max', ...max },
              { base: 'Q3', ...q3 },
              { base: 'Median', ...median },
              { base: 'Q1', ...q1 },
              { base: 'Min', ...min }
            ]
            break
        }
      }
      this.gridOptions.api.setPinnedTopRowData(pinnedRows)
    },
    isRowPinned (params) {
      return params.node.rowPinned
    },
    async refresh () {
      this.resetFilters()
      await this.getSummary()
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
      this.gridOptions.api.exportDataAsCsv(params)
    },
    toggleStatMode () {
      this.showStatMode = (this.showStatMode + 1) % 3
    }
  },
  watch: {
    showStatMode: function () {
      this.togglePinnedRows()
    },
    stats: function () {
      this.togglePinnedRows()
    }
  }
}
</script>
