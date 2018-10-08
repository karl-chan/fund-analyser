<template lang="pug">
  .column.gutter-y-sm
    // title
    .row.justify-between.items-center
      .row
        .q-headline Watch List
        q-btn.q-ml-xl(outline color="red" @click="clearWatchlist") Remove all
      q-btn-group
        q-btn(color="tertiary" :icon="showStatMode <= 1 ? 'expand_more' : 'expand_less'" @click="toggleStatMode")
          q-tooltip {{ showStatMode <= 1 ? 'Show' : 'Hide' }} statistics

    // table
    funds-table(:isins="watchlist" :highlightIsin="selectedIsin" :showStatMode="showStatMode"
                @rowSelected="onRowSelected")
      template(slot="empty-view")
        q-tooltip
          .row.items-center
            | Right click on funds in
            .text-weight-bold.q-px-sm SUMMARY VIEW
            | >
            q-icon.q-mx-xs(name="star" color="amber")
            | Add to watch list
        q-chip.absolute-center.shadow-5.z-top(square detail icon="warning" color="secondary") Your watchlist is empty

    // charts
    fund-chart-grid(:funds="funds" :cols="3" :selectedIsin="selectedIsin" @chartSelected="onChartSelected")
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
export default {
  name: 'FundWatchList',
  props: ['watchlist'],
  data () {
    return {
      selectedIsin: null,
      showStatMode: 0 // hidden
    }
  },
  computed: {
    funds: function () {
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
    },
    toggleStatMode () {
      this.showStatMode = (this.showStatMode + 1) % 3
    }
  }
}
</script>
