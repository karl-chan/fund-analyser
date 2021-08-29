<template lang="pug">

funds-table(:filterText="filterText" :showUpToDateOnly="showUpToDateOnly" height="500px")
  template(v-slot:title="")
    .column.q-gutter-y-sm
      .text-h5 Funds
      .row.justify-between.items-center.q-gutter-x-md
        div
          fund-search(placeholder="Filter table" @keystroke="filter" @input="filterFund")
        q-checkbox(v-model="showUpToDateOnly" label="Show up to date only" color="teal")
  template(v-slot:empty-view="")
    q-chip.absolute-center.shadow-5(square detail icon="error" color="negative" text-color="white" style="{z-index: 1}") Sorry, there are no matching funds
</template>

<script>

export default {
  name: 'FundsSummary',
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
    filterFund (isin) {
      this.filterText = isin || ''
    }
  }
}
</script>
