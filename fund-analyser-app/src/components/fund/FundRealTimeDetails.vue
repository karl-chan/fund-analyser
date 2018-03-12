<template>
  <div>
    <q-table title="Real time information" :data="realTimeDetails.holdings" :columns="holdingsColumns"
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
  name: 'fund-real-time-details',
  props: ['fund'],
  data () {
    return {
      realTimeDetails: this.reset(),
      pagination: {
        rowsPerPage: 10
      },
      holdingsColumns: [
        {name: 'name', label: 'Name', field: 'name', sortable: true, align: 'left'},
        {name: 'todaysChange', label: 'Todays \'Change (%)', field: 'todaysChange', sortable: true, format: val => 100 * val},
        {name: 'weight', label: 'Weight (%)', field: 'weight', sortable: true}
      ]
    }
  },
  watch: {
    fund: function (newFund, oldFund) {
      this.realTimeDetails = this.reset()
      this.broadcast()
      if (newFund) {
        this.getRealTimeDetails(newFund)
      }
    }
  },
  methods: {
    getRealTimeDetails (fund) {
      const vm = this
      this.$services.fundService.getRealTimeDetails(fund)
        .then(details => {
          vm.realTimeDetails = details
          this.broadcast()
        })
    },
    reset () {
      return {
        estChange: undefined,
        stdev: undefined,
        ci: undefined,
        holdings: []
      }
    },
    broadcast () {
      this.$emit('broadcast', this.realTimeDetails)
    }
  }
}
</script>

<style>
</style>
