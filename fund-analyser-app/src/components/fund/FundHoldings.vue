<template lang="pug">
  q-table(title="Real time information" :data="realTimeDetails.holdings" :columns="columns" :pagination.sync="pagination" row-key="name")
    q-tr(slot="body" slot-scope="props" :props="props")
      q-td(key="name" :props="props")
        |  {{ props.row.name }}
      q-td(key="todaysChange" :props="props" :class="{'text-green': props.row.todaysChange > 0, 'text-red': props.row.todaysChange < 0}")
        | {{ $utils.format.formatPercentage(props.row.todaysChange) }}
        q-btn(v-if="props.row.ticker" icon="info" @click="openURL('https://markets.ft.com/data/equities/tearsheet/summary?s=' + props.row.ticker)" color="primary" flat rounded dense)
      q-td(key="weight" :props="props")
        | {{ $utils.format.formatPercentage(props.row.weight) }}
</template>

<script>
import { openURL } from 'quasar'
export default {
  name: 'fund-holdings',
  props: ['realTimeDetails'],
  data () {
    return {
      pagination: {
        rowsPerPage: 10
      },
      columns: [
        {name: 'name', label: 'Name', field: 'name', sortable: true, align: 'left'},
        {name: 'todaysChange', label: 'Todays \'Change (%)', field: 'todaysChange', sortable: true, format: val => 100 * val},
        {name: 'weight', label: 'Weight (%)', field: 'weight', sortable: true}
      ]
    }
  },
  methods: {
    openURL
  }
}
</script>
