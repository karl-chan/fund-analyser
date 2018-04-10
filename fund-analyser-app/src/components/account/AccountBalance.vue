<template lang="pug">
  .column.gutter-y-md
    .q-display-1.text-grey Hello {{user}}
    div(v-if="balance")
      .row.gutter-lg
        div Portfolio: £{{balance.portfolio}}
        div Cash: £{{balance.cash}}
        div Total Value: £{{balance.totalValue}}
      div You have {{balance.holdings.length}} holdings:
      ag-grid-vue.ag-theme-balham.full-width(:columnDefs="columnDefs" :rowData="balance.holdings || []"
                  :gridReady="onGridReady" :rowDoubleClicked="onRowDoubleClicked" :gridOptions="gridOptions")

</template>

<script>
export default {
  name: 'AccountBalance',
  props: ['user', 'balance'],
  data () {
    return {
      columnDefs: [
        { headerName: 'ISIN', field: 'ISIN', width: 100, hide: true },
        { headerName: 'Name', field: 'Description', width: 250 },
        { headerName: 'Market Value', field: 'MktValue', width: 100, valueFormatter: this.numberFormatter },
        { headerName: 'Quantity', field: 'Quantity', width: 90, valueFormatter: this.numberFormatter },
        { headerName: 'Total Change', field: 'ChangeInValue', width: 100, valueFormatter: this.numberFormatter, cellClass: this.colourNumberStyler },
        { headerName: '% Change', field: 'PercentChangeInValue', width: 100, cellClass: this.colourNumberStyler, valueFormatter: this.percentFormatter },
        { headerName: 'Currency', field: 'Currency', width: 65 },
        { headerName: 'Mid', field: 'Mid', width: 65, valueFormatter: this.numberFormatter },
        { headerName: 'Bid', field: 'Bid', width: 65, valueFormatter: this.numberFormatter },
        { headerName: 'Ask', field: 'Ask', width: 65, valueFormatter: this.numberFormatter },
        { headerName: 'Book Cost', field: 'BookCost', width: 100, valueFormatter: this.numberFormatter },
        { headerName: 'Tax Cost', field: 'TaxCost', width: 100, valueFormatter: this.numberFormatter },
        { headerName: 'Type', field: 'FundType', width: 80 },
        { headerName: 'Sector', field: 'Sector', width: 100 },
        { headerName: 'Asset Class', field: 'AssetClass', width: 150 }
      ],
      gridOptions: {
        domLayout: 'autoHeight',
        enableColResize: true,
        enableFilter: true,
        enableRangeSelection: true,
        enableSorting: true,
        suppressLoadingOverlay: true,
        suppressNoRowsOverlay: true,
        toolPanelSuppressSideButtons: true,
        rowStyle: {
          cursor: 'pointer'
        }
      }
    }
  },
  methods: {
    onGridReady (params) {
      this.updateColDefs(params)
    },
    onRowDoubleClicked (params) {
      this.$utils.router.redirectToFund(params.data.ISIN, {newTab: true})
    },
    percentFormatter (params, fallbackValue) {
      return this.$utils.format.formatPercentage(params.value / 100, true, fallbackValue)
    },
    colourNumberStyler (params) {
      return this.$utils.format.colourNumber(params.value)
    },
    numberFormatter (params) {
      return this.$utils.format.formatNumber(params.value)
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

<style>
</style>
