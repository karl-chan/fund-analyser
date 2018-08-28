<template lang="pug">
  .column.gutter-y-sm
    .q-headline Summary
    // toolbar
    .row.justify-between.items-center.gutter-x-md
      div
        fund-search(placeholder="Filter table" @input="filter" @select="filterFund")
      .row.justify-end.items-center.gutter-x-md
        div As of: {{ $utils.format.formatDateLong(asof) }}
        div
          q-btn-group
            q-btn(color="tertiary" icon="fas fa-file-excel" @click="exportCsv")
              q-tooltip Export to CSV
            q-btn(color="tertiary" :icon="showPinnedRows? 'expand_less': 'expand_more'" @click="togglePinnedRows")
              q-tooltip {{ showPinnedRows ? 'Hide' : 'Show' }} statistics

    // actual table
    //- funds-table(:funds="summary" :showPinnedRows="showPinnedRows" :showEmptyView="showEmptyView" :filterText="filterText"
    //-             height="500px" ref="fundsTable")
    funds-rolling-table(:showPinnedRows="showPinnedRows" :filterText="filterText" height="500px" ref="fundsTable"
                        @rowsChanged="onRowsChanged")
      template(slot="empty-view")
        q-chip.absolute-center.shadow-5.z-top(square detail icon="error" color="negative") Sorry, there are no matching funds
</template>

<script>

export default {
  name: 'FundsSummary',
  data () {
    return {
      asof: null,
      showPinnedRows: true,
      filterText: ''
    }
  },
  methods: {
    filter (text) {
      this.filterText = text
    },
    filterFund (fund) {
      this.filterText = fund.isin
    },
    togglePinnedRows () {
      this.showPinnedRows = !this.showPinnedRows
    },
    onRowsChanged (metadata) {
      this.asof = metadata.asof
    },
    exportCsv () {
      this.$refs.fundsTable.exportCsv()
    }
  }
}
</script>
