<template lang="pug">
  .column.gutter-y-sm
    .q-headline Summary
    // toolbar
    .row.justify-between.items-center.gutter-x-md
      div
        fund-search(placeholder="Filter table" @input="filter" @select="filterFund")
      .row.justify-end.items-center.gutter-x-md
        div As of: {{ $utils.format.formatDateLong(asofDate) }}
        q-btn(icon="info" color="primary" flat rounded dense)
          q-tooltip
            .q-subheading.q-mb-sm
              <b>{{ pctUpToDate }}</b> up to date
            div {{ numUpToDate }} out of {{ totalFunds }} funds
        div
          q-btn-group
            q-btn(color="tertiary" icon="refresh" @click="refreshData")
              q-tooltip Refresh data
            q-btn(color="tertiary" icon="fas fa-file-excel" @click="exportCsv")
              q-tooltip Export to CSV
            q-btn(color="tertiary" :icon="showPinnedRows? 'expand_less': 'expand_more'" @click="togglePinnedRows")
              q-tooltip {{ showPinnedRows ? 'Hide' : 'Show' }} statistics

    // actual table
    funds-table(:showPinnedRows="showPinnedRows" :filterText="filterText" height="500px" ref="fundsTable"
                @rowsChanged="onRowsChanged")
      template(slot="empty-view")
        q-chip.absolute-center.shadow-5.z-top(square detail icon="error" color="negative") Sorry, there are no matching funds
</template>

<script>

export default {
  name: 'FundsSummary',
  data () {
    return {
      asofDate: null,
      showPinnedRows: true,
      filterText: '',
      numUpToDate: 0,
      totalFunds: 0
    }
  },
  computed: {
    pctUpToDate: function () {
      return this.$utils.format.formatPercentage(this.numUpToDate / this.totalFunds, '0%')
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
      this.asofDate = metadata.asof.date
      this.numUpToDate = metadata.asof.numUpToDate
      this.totalFunds = metadata.totalFunds
    },
    refreshData () {
      this.$refs.fundsTable.refresh()
    },
    exportCsv () {
      this.$refs.fundsTable.exportCsv()
    }
  }
}
</script>
