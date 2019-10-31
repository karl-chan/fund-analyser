<template lang="pug">

  funds-table(:filterText="filterText" height="500px" ref="fundsTable")
    template(slot="title")
      .column.q-gutter-y-sm
        .text-h5 Summary
        .row.justify-between.items-center.q-gutter-x-md
          div
            fund-search(placeholder="Filter table" @input="filter" @select="filterFund")
    template(slot="empty-view")
      q-chip.absolute-center.shadow-5(square detail icon="error" color="negative" style="{z-index: 1}") Sorry, there are no matching funds
</template>

<script>

export default {
  name: 'FundsSummary',
  data () {
    return {
      filterText: ''
    }
  },
  methods: {
    filter (text) {
      this.filterText = text
    },
    filterFund (fund) {
      this.filterText = fund.isin
    }
  }
}
</script>
