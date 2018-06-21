<template lang="pug">
  .column.gutter-y-sm
    // toolbar
    .row.justify-between.items-center.gutter-x-md(:class="{invisible: !dataReady}")
      div
        fund-search(placeholder="Filter table" @input="filter" @select="filterFund")
      .row.justify-end.items-center.gutter-x-md
        div As of: {{ $utils.format.formatDateLong(asof) }}
        div
          q-btn-group
            q-btn(:color="outdated? 'primary': 'tertiary'" icon="refresh" @click="startDownload" :glossy="outdated")
              q-tooltip Refresh dataset
            q-btn(color="tertiary" icon="fas fa-file-excel" @click="exportCsv")
              q-tooltip Export to CSV
            q-btn(color="tertiary" :icon="showPinnedRows? 'expand_less': 'expand_more'" @click="togglePinnedRows")
              q-tooltip {{ showPinnedRows ? 'Hide' : 'Show' }} statistics

    // actual table
    funds-table(:funds="summary" :showPinnedRows="showPinnedRows" :showEmptyView="showEmptyView" :filterText="filterText"
                style="height:500px" ref="fundsTable")
      template(slot="empty-view")
        q-btn.absolute-center.z-max(:loading="downloading" @click="startDownload"
                                    color="secondary" size="xl" icon="file_download")
</template>

<script>
export default {
  name: 'FundsSummary',
  props: ['summary'],
  data () {
    return {
      downloading: false,
      showPinnedRows: true,
      filterText: ''
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
    },
    showEmptyView: function () {
      return this.downloading || !this.dataReady
    }
  },
  methods: {
    async startDownload () {
      this.downloading = true
      await this.$emit('requestSummary')
      this.downloading = false
    },
    filter (text) {
      this.filterText = text
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
