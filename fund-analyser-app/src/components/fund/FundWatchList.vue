<template lang="pug">
  .column.gutter-y-sm
    // toolbar
    .row.justify-between.items-center
      .row.items-center
        .q-headline Watch List
        q-btn.q-ml-xl(v-if="dataReady" outline color="red" @click="clearWatchlist") Remove all

      .row
        q-btn(glossy icon="show_chart" color="secondary" @click="toggleCharts")

    // actual table
    funds-table(:funds="funds" :showEmptyView="!dataReady" :highlightIsin="selectedIsin" :rowSelectedHandler="onRowSelected")
      template(slot="empty-view")
        q-tooltip
          .row.items-center
            | Right click on funds in Summary view >
            q-icon.q-mx-xs(name="star" color="amber")
            | Add to watch list
        q-chip.absolute-center.shadow-5(square detail icon="warning" color="secondary") Watchlist is empty

    // grid of charts
    q-slide-transition
      fund-chart-grid(v-show="showCharts" :funds="funds" :cols="3" :selectedIsin="selectedIsin" :chartSelectedHandler="onChartSelected")
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
export default {
  name: 'FundWatchList',
  props: ['watchlist'],
  data () {
    return {
      showCharts: false,
      selectedIsin: null
    }
  },
  computed: {
    dataReady: function () {
      return this.watchlist && this.watchlist.length
    },
    funds: function () {
      if (!this.dataReady) {
        return []
      }
      return this.watchlist.map(isin => this.lookupFund()(isin))
    }
  },
  methods: {
    ...mapActions('account', ['clearWatchlist']),
    ...mapGetters('funds', ['lookupFund']),
    onRowSelected (params) {
      this.selectedIsin = params.data.isin
    },
    onChartSelected (fund) {
      this.selectedIsin = fund && fund.isin
    },
    toggleCharts () {
      this.showCharts = !this.showCharts
    }
  }
}
</script>
