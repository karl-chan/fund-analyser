<template lang="pug">
  .column.gutter-y-sm
    // table
    funds-table(:isins="watchlist" :highlightIsin="selectedIsin"
                @rowSelected="onRowSelected")
      template(slot="title")
        .row.justify-between.items-center
          .q-headline Watch List
          q-btn.q-ml-xl(outline color="red" @click="clearWatchlistPrompt") Remove all
      template(slot="empty-view")
        q-tooltip
          .row.items-center
            | Right click on funds in
            .text-weight-bold.q-px-sm SUMMARY VIEW
            | >
            q-icon.q-mx-xs(name="star" color="amber")
            | Add to watch list
        q-chip.absolute-center.shadow-5(square detail icon="warning" color="secondary" style="{z-index: 1}") Your watchlist is empty

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
      selectedIsin: null
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
    clearWatchlistPrompt () {
      this.$q.dialog({
        title: 'Clear watchlist?',
        message: 'This will remove the watchlist associated with your account. This action is irreversible!',
        ok: {
          color: 'negative',
          label: 'Proceed'
        },
        cancel: {
          color: 'positive',
          label: 'Cancel'
        }
      }).then(() => {
        this.clearWatchlist()
      }).catch(() => {
        this.$q.notify({ message: 'Action cancelled', type: 'positive' })
      })
    }
  }
}
</script>
