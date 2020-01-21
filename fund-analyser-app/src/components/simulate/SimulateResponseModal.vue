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
            q-table.holdings-history-table(title="Holdings history"
                    dense table-style="max-height: 400px" row-key="from"
                    :data="simulation.simulateResponse.statement.events" :columns="eventsColumns"
                    virtual-scroll :pagination.sync="pagination" :rows-per-page-options="[0]")
              template(v-slot:body="props")
                q-tr(:props="props")
                  q-td(key="from" :props="props") {{ props.row.from }}
                  q-td(key="to" :props="props") {{ props.row.to }}
                  q-td(key="pctChange" :props="props" :style="colourPctChange(props.row)") {{ getPctChangeFromEvent(props.row) }}
                  q-td(key="isins" :props="props") {{ getIsinsFromEvent(props.row) }}
                  q-td(key="names" :props="props") {{ getNamesFromEvent(props.row) }}
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
        { name: 'from', label: 'From', field: 'from', align: 'left', sortable: true },
        { name: 'to', label: 'To', field: 'to', align: 'left', sortable: true },
        { name: 'pctChange', label: '% Change', field: 'pctChange', align: 'left', sortable: true },
        { name: 'isins', label: 'ISINs', align: 'left' },
        { name: 'names', label: 'Names', align: 'left' }
      ],
      funds: [],
      pagination: { rowsPerPage: 0 }
    }
  },
  methods: {
    open () {
      this.openModal = true
    },
    colourPctChange (event) {
      return this.$utils.format.colourNumberCell(event.pctChange * 10) // arbitrary multiplier to increase colour contrast
    },
    getPctChangeFromEvent (event) {
      return this.$utils.format.formatPercentage(event.pctChange)
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

<style lang="stylus">
.holdings-history-table
  .q-table__middle
    max-height: 200px

  thead tr:first-child th
    background-color: $grey-3

  thead tr th
    position: sticky
    z-index: 1
  thead tr:first-child th
    top: 0

  &.q-table--loading thead tr:last-child th
    top: 48px
</style>
