<template lang="pug">
  .column.gutter-y-md
    .q-display-1.text-grey Hello {{user}}
    div(v-if="balance")
      .row.gutter-lg
        div Portfolio: £{{balance.portfolio}}
        div Cash: £{{balance.cash}}
        div Total Value: £{{balance.totalValue}}
      div You have {{balance.holdings.length}} holdings:

      .relative-position
        ag-grid-vue.ag-theme-balham.full-width(:columnDefs="columnDefs" :rowData="holdings || []"
                  :gridReady="onGridReady" :rowDoubleClicked="onRowDoubleClicked" :gridOptions="gridOptions")
        .absolute-top-left.light-dimmed.fit(v-if="!holdings || !holdings.length")
          q-chip.absolute-center.shadow-5(square detail icon="info" color="secondary") Nothing to show

</template>

<script>
export default {
  name: 'AccountBalance',
  props: ['user', 'balance', 'realTimeDetails'],
  data () {
    return {
      columnDefs: [
        { headerName: 'ISIN', hide: true, field: 'ISIN', width: 100 },
        { headerName: 'Name', field: 'Description', width: 250 },
        { headerName: '% Real Time Est', field: 'realTimeEstPercent', width: 80, valueFormatter: this.percentFormatter, cellClass: this.colourNumberBoldStyler },
        { headerName: 'Real Time Est', field: 'realTimeEst', width: 80, valueFormatter: this.numberFormatter, cellClass: this.colourNumberStyler },
        { headerName: '% Day Change', field: 'PricePercentChange', width: 80, valueFormatter: this.percentFormatterDiv100, cellClass: this.colourNumberBoldStyler },
        { headerName: 'Day Change', width: 80, valueGetter: this.dayChangeGetter, valueFormatter: this.numberFormatter, cellClass: this.colourNumberStyler },
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
        enableColResize: true,
        enableFilter: true,
        enableRangeSelection: true,
        enableSorting: true,
        gridAutoHeight: true,
        popupParent: document.body,
        suppressLoadingOverlay: true,
        suppressNoRowsOverlay: true,
        toolPanelSuppressSideButtons: true,
        rowStyle: {
          cursor: 'pointer'
        }
      }
    }
  },
  computed: {
    holdings: function () {
      if (!this.balance || !this.balance.holdings) {
        return []
      }
      return this.balance.holdings.map(h => {
        const isin = h.ISIN
        const realTimeEstPercent = isin in this.realTimeDetails ? this.realTimeDetails[isin]['estChange'] : undefined
        const realTimeEst = h.MktValue * realTimeEstPercent
        return {...h, realTimeEst, realTimeEstPercent}
      })
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

<style>
</style>
