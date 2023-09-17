<template lang="pug">
.column.q-gutter-y-sm
  // table
  funds-table(:isins="fundWatchlist" :highlightIsin="selectedIsin" @row-selected="onRowSelected")
    template(v-slot:title="")
      .row.justify-between.items-center
        .text-h5 Fund Watchlist
        q-btn.q-ml-xl(outline color="red" @click="clearFundWatchlist") Remove all
    template(v-slot:empty-view="")
      q-tooltip
        .row.items-center
          | Right click on funds in
          .text-weight-bold.q-px-sm SUMMARY VIEW
          | >
          q-icon.q-mx-xs(name="star" color="amber")
          | Add to watch list
      q-chip.absolute-center.shadow-5(square detail icon="warning" color="secondary" text-color="white" style="{z-index: 1}") Your fund watchlist is empty

  // charts
  fund-chart-grid(:funds="funds" :cols="3" :selectedIsin="selectedIsin" @chart-selected="onChartSelected")
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
export default {
  name: 'FundWatchList',
  props: ['fundWatchlist'],
  data() {
    return {
      selectedIsin: null
    }
  },
  computed: {
    ...mapGetters('funds', ['lookupFund']),
    funds: function () {
      return this.fundWatchlist.map(isin => this.lookupFund(isin))
        .filter(f => f) // remove undefined entries in case fund not ready
    }
  },
  methods: {
    ...mapActions('account', ['clearFundWatchlist']),
    onRowSelected(params) {
      this.selectedIsin = params.data.isin
    },
    onChartSelected(fund) {
      this.selectedIsin = fund && fund.isin
    }
  }
}
</script>
