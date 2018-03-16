<template>
  <div>
    <q-table title="Real time information" :data="realTimeDetails.holdings" :columns="columns"
            :pagination.sync="pagination" row-key="name">
      <q-tr slot="body" slot-scope="props" :props="props">
        <q-td key="name" :props="props">{{ props.row.name }}</q-td>
        <q-td key="todaysChange" :props="props"
              :class="{'text-green': props.row.todaysChange > 0, 'text-red': props.row.todaysChange < 0}">
          {{ $utils.formatUtils.formatPercentage(props.row.todaysChange) }}
        </q-td>
        <q-td key="weight" :props="props">{{ $utils.formatUtils.formatPercentage(props.row.weight) }}</q-td>
      </q-tr>
    </q-table>
  </div>
</template>

<script>
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
  }
}
</script>

<style>
</style>
