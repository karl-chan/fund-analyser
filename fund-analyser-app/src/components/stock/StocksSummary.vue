<template lang="pug">

stocks-table(:filterText="filterText" :showUpToDateOnly="showUpToDateOnly"  height="500px")
  template(v-slot:title="")
    .column.q-gutter-y-sm
      .text-h5 Stocks
      .row.justify-between.items-center.q-gutter-x-md
        div
          stock-search(placeholder="Filter table" @keystroke="filter" @input="filterStock")
        q-checkbox(v-model="showUpToDateOnly" label="Show up to date only" color="teal")
  template(v-slot:empty-view="")
    q-chip.absolute-center.shadow-5(square detail icon="error" color="negative" text-color="white" style="{z-index: 1}") Sorry, there are no matching stocks
</template>

<script>

export default {
  name: 'StocksSummary',
  data () {
    return {
      filterText: '',
      showUpToDateOnly: false
    }
  },
  methods: {
    filter (text) {
      this.filterText = text
    },
    filterStock (symbol) {
      this.filterText = symbol || ''
    }
  }
}
</script>
