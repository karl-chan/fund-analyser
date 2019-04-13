<template lang="pug">
  .shadow-5.container(v-if="fund")
    .row.items-center.gutter-x-xl
      .q-display-1 Indicators
      div
        q-input(v-model="filter" float-label="Filter by property" inverted color="tertiary"
              :before="[{icon: 'fas fa-filter', handler () {}}]")
    .q-mt-lg.table-container
      q-table(:data="rows" :columns="columns" :filter="filter" row-key="key"
              dark dense :no-results-label="noMatchLabel"
              :pagination.sync="pagination")
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'FundIndicators',
  props: ['fund'],
  data: function () {
    return {
      filter: '',
      columns: [
        { field: 'name', label: 'Name', align: 'left' },
        { field: 'value', label: 'Value' }
      ],
      pagination: {
        page: 1,
        rowsPerPage: 0
      }
    }
  },
  computed: {
    ...mapState('funds', ['indicatorSchema']),
    rows: function () {
      return Object.entries(this.fund.indicators).map(([key, { value, metadata }]) => {
        const { name, format } = this.indicatorSchema[key]
        switch (format) {
          case 'percent':
            value = this.$utils.format.formatPercentage(value, true)
            break
          default:
            value = this.$utils.format.formatNumber(value, true)
        }
        return { key, name, value }
      })
    },
    noMatchLabel: function () {
      return 'No indicators matching: ' + this.filter
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '~variables'

.container
  padding 30px
  border-radius 10px
  background-color goldenrod
  color white

.table-container
  background-color rgba(0, 0, 0, 0.1)
  font-size: 40px
</style>
