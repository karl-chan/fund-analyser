<template lang="pug">
  .column.gutter-y-sm
    .row.items-center
      .q-headline Watch List
      q-btn.q-ml-xl(v-if="dataReady" outline color="red" @click="clearWatchlist") Remove all
    // actual table
    funds-table(:funds="watchlist" :showEmptyView="!dataReady")
      template(slot="empty-view")
        q-tooltip
          .row.items-center
            | Right click on funds in Summary view >
            q-icon.q-mx-xs(name="star" color="amber")
            | Add to favourites
        q-chip.absolute-center.shadow-5(square detail icon="warning" color="secondary") Watchlist is empty

</template>

<script>
import { mapActions } from 'vuex'
export default {
  name: 'FundWatchList',
  props: ['watchlist'],
  computed: {
    dataReady: function () {
      return this.watchlist && this.watchlist.length
    }
  },
  methods: {
    ...mapActions('account', ['clearWatchlist'])
  }
}
</script>
