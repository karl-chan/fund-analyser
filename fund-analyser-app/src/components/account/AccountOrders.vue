<template lang="pug">
  ag-grid-vue.ag-theme-balham.full-width(:columnDefs="columnDefs" :rowData="orders || []"
            @grid-ready="onGridReady" :gridOptions="gridOptions")
</template>

<script>
export default {
  name: 'AccountOrders',
  props: ['orders'],
  data () {
    return {
      columnDefs: [
        { headerName: 'Status', field: 'status', width: 80 },
        { headerName: 'Order Ref', field: 'orderRef', width: 80 },
        { headerName: 'Side', field: 'side', width: 80 },
        { headerName: 'Sedol', field: 'sedol', width: 80 },
        { headerName: 'Name', field: 'name', width: 250 },
        { headerName: 'Qty', field: 'quantity', width: 80 },
        { headerName: 'Settlement Date', field: 'settlementDate', valueFormatter: this.dateFormatter, width: 100 },
        { headerName: 'Order Date', field: 'orderDate', valueFormatter: this.dateFormatter, width: 100 },
        { headerName: 'Price', field: 'price', width: 100 },
        { headerName: 'Consideration', field: 'consideration', width: 120 },
        { headerName: 'Fee', field: 'fundDealingFee', width: 60 },
        { headerName: 'Other', field: 'other', width: 100 },
        { headerName: 'Est. Proceeds', field: 'estimatedProceeds', width: 120 }

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
  methods: {
    onGridReady (params) {
      this.updateColDefs(params)
    },
    updateColDefs (params) {
      const newColDefs = params.columnApi.getAllColumns().map(col => {
        const colDef = col.getColDef()
        colDef.headerTooltip = colDef.headerName
        return colDef
      })
      params.api.setColumnDefs(newColDefs)
    },
    dateFormatter (params) {
      return this.$utils.format.formatDateShort(params.value, true)
    }
  }
}
</script>
