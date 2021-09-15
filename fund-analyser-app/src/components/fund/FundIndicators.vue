<template lang="pug">
.shadow-5.container(v-if="fund")
  .row.items-center.q-gutter-x-xl
    .text-h4 Indicators
    div
      q-input(v-model="filter" label="Filter by property"
              color="accent" bg-color="grey-2" outlined clearable)
        template(v-slot:prepend)
            q-icon(name="fas fa-filter")
  q-table.q-mt-lg(:rows="rows" :columns="columns" :filter="filter" row-key="key"
                  card-class="table-container" dark dense :no-results-label="noMatchLabel"
                  :pagination.sync="pagination")
    template(v-slot:body="props")
      q-tr(:props="props")
        q-td(key="name" :props="props")
          |  {{ props.row.name }}
        q-td(key="value" :props="props")
          | {{ props.row.value }}
        q-td(key="metadata" :props="props")
          pre {{ props.row.metadata }}
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
        { name: 'name', label: 'Name', field: 'name', align: 'left' },
        { name: 'value', label: 'Value', field: 'value', align: 'left' },
        { name: 'metadata', label: 'Metadata', field: 'metadata', align: 'left' }
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
        return { key, name, value, metadata: JSON.stringify(metadata, null, 4) }
      })
    },
    noMatchLabel: function () {
      return 'No indicators matching: ' + this.filter
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  padding: 30px;
  border-radius: 10px;
  background-color: #daa520;
  color: #fff;
}
.table-container {
  background-color: rgba(0,0,0,0.1);
  font-size: 40px;
}
</style>
