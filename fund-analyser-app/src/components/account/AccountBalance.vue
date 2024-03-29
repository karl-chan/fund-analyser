<template lang="pug">
.column.q-gutter-y-xs
  .row.justify-between
    .column
      .row.q-gutter-lg
        div Portfolio: £{{balance.portfolio}}
        div Cash: £{{balance.cash}}
        div Total Value: £{{balance.totalValue}}
      div You have {{balance.holdings.length}} holdings:
    slot(name="toolbar")

  .relative-position
    ag-grid-vue.ag-theme-balham.full-width(:columnDefs="columnDefs" :rowData="holdings"
              @grid-ready="onGridReady" @rowDoubleClicked="onRowDoubleClicked" :gridOptions="gridOptions")
    .absolute-top-left.light-dimmed.fit(v-if="!holdings.length")
      q-chip.absolute-center.shadow-5(square detail icon="info" color="secondary") Nothing to show

</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'AccountBalance',
  props: ['balance'],
  data () {
    return {
      columnDefs: [
        { headerName: 'ISIN', hide: true, field: 'ISIN', width: 100 },
        { headerName: 'Name', field: 'Description', width: 250 },
        { headerName: '%1D', field: 'PricePercentChange', width: 80, valueFormatter: this.percentFormatterDiv100, cellClass: this.colourNumberBoldStyler },
        { headerName: '1D', width: 80, valueGetter: this.dayChangeGetter, valueFormatter: this.numberFormatter, cellClass: this.colourNumberStyler },
        { headerName: '% Total Change', field: 'PercentChangeInValue', width: 80, valueFormatter: this.percentFormatterDiv100, cellClass: this.colourNumberBoldStyler },
        { headerName: 'Total Change', field: 'ChangeInValue', width: 80, valueFormatter: this.numberFormatter, cellClass: this.colourNumberStyler },
        { headerName: 'Mid', field: 'Mid', width: 65, valueFormatter: this.numberFormatter },
        { headerName: 'Bid', field: 'Bid', width: 65, valueFormatter: this.numberFormatter },
        { headerName: 'Ask', field: 'Ask', width: 65, valueFormatter: this.numberFormatter },
        { headerName: 'Book Cost', field: 'BookCost', width: 100, valueFormatter: this.numberFormatter },
        { headerName: 'Market Value', field: 'MktValue', width: 80, valueFormatter: this.numberFormatter },
        { headerName: 'Quantity', field: 'Quantity', width: 80, valueFormatter: this.numberFormatter },
        { headerName: 'Currency', field: 'Currency', width: 65 },
        { headerName: 'Tax Cost', field: 'TaxCost', width: 100, valueFormatter: this.numberFormatter },
        { headerName: 'Type', field: 'FundType', width: 80 },
        { headerName: 'Sector', field: 'Sector', width: 100 },
        { headerName: 'Asset Class', field: 'AssetClass', width: 150 }
      ],
      gridOptions: {
        defaultColDef: {
          filter: true,
          resizable: true,
          sortable: true
        },
        enableRangeSelection: true,
        domLayout: 'autoHeight',
        popupParent: document.body,
        suppressLoadingOverlay: true,
        suppressNoRowsOverlay: true,
        rowStyle: {
          cursor: 'pointer'
        }
      }
    }
  },
  computed: {
    ...mapGetters('funds', ['lookupFund']),
    holdings: function () {
      return this?.balance?.holdings ?? []
    }
  },
  methods: {
    onGridReady (params) {
      this.updateColDefs(params)
    },
    onRowDoubleClicked (params) {
      this.$utils.router.redirectToFund(params.data.ISIN, { newTab: true })
    },
    percentFormatter (params, fallbackValue) {
      return this.$utils.format.formatPercentage(params.value, true, fallbackValue)
    },
    percentFormatterDiv100 (params, fallbackValue) {
      return this.$utils.format.formatPercentage(params.value / 100, true, fallbackValue)
    },
    colourNumberStyler (params) {
      return this.$utils.format.colourNumber(params.value)
    },
    colourNumberBoldStyler (params) {
      return [this.colourNumberStyler(params), 'text-weight-bold']
    },
    numberFormatter (params) {
      return this.$utils.format.formatNumber(params.value)
    },
    dayChangeGetter (params) {
      return params.data.MktValue - params.data.MktValue / (1 + params.data.PricePercentChange / 100)
    },
    updateColDefs (params) {
      const newColDefs = params.columnApi.getAllColumns().map(col => {
        const colDef = col.getColDef()
        colDef.headerTooltip = colDef.headerName
        return colDef
      })
      params.api.setColumnDefs(newColDefs)
    }
  }
}
</script>
