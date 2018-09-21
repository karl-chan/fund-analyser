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
            q-btn(color="tertiary" :icon="showStatMode <= 1 ? 'expand_more' : 'expand_less'" @click="toggleStatMode")
              q-tooltip {{ showStatMode <= 1 ? 'Show' : 'Hide' }} statistics

    // actual table
    funds-table(:showStatMode="showStatMode" :filterText="filterText" height="500px" ref="fundsTable"
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
      showStatMode: 1, // show min, median, max only
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
    toggleStatMode () {
      this.showStatMode = (this.showStatMode + 1) % 3
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
