<template lang="pug">
  q-dialog(v-model="openModal" full-width)
    q-card
      q-card-section
        .text-h6 Query Details
      q-card-section
        .row.q-col-gutter-x-md
          .col-4
            q-list
              q-item Strategy: {{simulation.simulateParam.strategy}}
              q-item Num portfolio: {{simulation.simulateParam.numPortfolio}}
              q-item Date: {{prediction.date}}
              q-item Funds:
            q-table(dense hide-bottom :data="funds" :columns="queryColumns" row-key="isin")
          .col-8
            q-table(title="Holdings history" dense table-style="max-height: 400px" row-key="from"
                    :data="simulation.simulateResponse.statement.events" :columns="eventsColumns"
                    virtual-scroll :pagination.sync="pagination" :rows-per-page-options="[0]")

</template>

<script>
export default {
  name: 'SimulateResponseModal',
  props: ['prediction', 'simulation'],
  data () {
    return {
      openModal: false,
      queryColumns: [
        { name: 'isin', label: 'ISIN', field: 'isin', align: 'left' },
        { name: 'name', label: 'Name', field: 'name', align: 'left' }
      ],
      eventsColumns: [
        { name: 'from', label: 'From', field: 'from', align: 'left' },
        { name: 'to', label: 'To', field: 'to', align: 'left' },
        { name: 'isins', label: 'ISINs', field: this.getIsinsFromEvent, align: 'left' },
        { name: 'names', label: 'Names', field: this.getNamesFromEvent, align: 'left' }
      ],
      funds: [],
      pagination: { rowsPerPage: 0 }
    }
  },
  methods: {
    open () {
      this.openModal = true
    },
    getIsinsFromEvent (event) {
      return event.holdings.map(holding => holding.isin).join(', ')
    },
    getNamesFromEvent (event) {
      return event.holdings.map(holding => holding.name).join(', ')
    }
  },
  watch: {
    simulation: {
      immediate: true,
      async handler (value) {
        const response = await this.$services.fund.list(value.simulateParam.isins)
        this.funds = response.funds
      }
    }
  }
}
</script>
