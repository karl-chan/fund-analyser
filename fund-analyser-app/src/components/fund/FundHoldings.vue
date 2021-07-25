<template lang="pug">
q-table(title="Real time information" :rows="rowData" :columns="columns" :pagination.sync="pagination" row-key="name"
        no-results-label="No information available" dense :hide-bottom="!!rowData.length")
  q-tr(slot="body" slot-scope="props" :props="props")
    q-td(key="name" :props="props" style="max-width: 75px; overflow: hidden; text-overflow: ellipsis")
      |  {{ props.row.name }}
      q-tooltip {{ props.row.name }}
    q-td(key="todaysChange" :props="props" :class="{'text-green': props.row.todaysChange > 0, 'text-red': props.row.todaysChange < 0}")
      | {{ $utils.format.formatPercentage(props.row.todaysChange) }}
      q-btn(v-if="props.row.symbol" icon="info" @click="openURL('https://markets.ft.com/data/equities/tearsheet/summary?s=' + props.row.symbol)" color="primary" flat rounded dense)
    q-td(key="weight" :props="props")
      | {{ $utils.format.formatPercentage(props.row.weight) }}
    q-td(key="currency" :props="props")
      | {{ $utils.format.formatString(props.row.currency) }}
</template>

<script>
import { openURL } from 'quasar'
export default {
  name: 'FundHoldings',
  props: ['fund'],
  data () {
    return {
      pagination: {
        rowsPerPage: 20
      },
      columns: [
        { name: 'name', label: 'Name', field: 'name', sortable: true, align: 'left' },
        { name: 'todaysChange', label: 'Todays \'Change (%)', field: 'todaysChange', sortable: true, format: val => 100 * val },
        { name: 'weight', label: 'Weight (%)', field: 'weight', sortable: true },
        { name: 'currency', label: 'Currency', field: 'currency', sortable: true }
      ]
    }
  },
  computed: {
    rowData: function () {
      return (this.fund.realTimeDetails && this.fund.realTimeDetails.holdings) || []
    }
  },
  methods: {
    openURL
  }
}
</script>
