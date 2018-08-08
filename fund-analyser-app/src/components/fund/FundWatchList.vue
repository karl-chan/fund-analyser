<template lang="pug">
  .column.gutter-y-sm
    // title
    .row.items-center
      .q-headline Watch List
      q-btn.q-ml-xl(v-if="dataReady" outline color="red" @click="clearWatchlist") Remove all

    // table
    funds-table(:funds="funds" :showEmptyView="!dataReady" :highlightIsin="selectedIsin" :rowSelectedHandler="onRowSelected")
      template(slot="empty-view")
        q-tooltip
          .row.items-center
            | Right click on funds in Summary view >
            q-icon.q-mx-xs(name="star" color="amber")
            | Add to watch list
        q-chip.absolute-center.shadow-5(square detail icon="warning" color="secondary") Watchlist is empty

    // charts
    q-slide-transition
      fund-chart-grid(:funds="funds" :cols="3" :selectedIsin="selectedIsin" :chartSelectedHandler="onChartSelected")
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
export default {
  name: 'FundWatchList',
  props: ['watchlist'],
  data () {
    return {
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
        .filter(f => f) // remove undefined entries in case fund not ready
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
    }
  }
}
</script>
