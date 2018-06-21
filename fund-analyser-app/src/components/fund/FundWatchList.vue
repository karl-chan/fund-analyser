<template lang="pug">
  .column.gutter-y-sm

    // actual table
    funds-table(:funds="watchlist" :showEmptyView="true" style="min-height: 100px")
      template(slot="empty-view")
        q-chip.absolute-center.z-max.shadow-5(square detail icon="visibility_off" color="primary") Currently empty (Add from Summary)
</template>

<script>
export default {
  name: 'FundWatchList',
  props: ['watchlist'],
  data () {
    return {
    }
  },
  computed: {
    dataReady: function () {
      return this.summary && this.summary.length
    },
    asof: function () {
      if (!this.dataReady) {
        return undefined
      }
      const asofs = this.summary.map(f => Date.parse(f.asof))
      const globalAsof = Math.max.apply(null, asofs.filter(isFinite))
      return new Date(globalAsof)
    },
    outdated: function () {
      return this.$utils.date.isBeforeToday(this.asof)
    }
  },
  methods: {
    async startDownload () {
      this.downloading = true
      await this.getSummary()
      this.downloading = false
    },
    filterFund (fund) {
      this.filterText = fund.isin
    },
    togglePinnedRows () {
      this.showPinnedRows = !this.showPinnedRows
    },
    exportCsv () {
      this.$refs.fundsTable.exportCsv()
    }
  }
}
</script>
