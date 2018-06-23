<template lang="pug">
  .column.gutter-y-sm
    .row.items-center
      .q-headline Watch List
      q-btn.q-ml-xl(v-if="dataReady" outline color="red" @click="removeAllFavouriteIsins") Remove all
    // actual table
    funds-table(:funds="watchlist" :showEmptyView="!dataReady")
      template(slot="empty-view")
        q-chip.absolute-center.z-max.shadow-5(square detail icon="warning" color="secondary") Watchlist is empty
          q-tooltip(:offset="[0, 25]") Right click in Summary view to add
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
    ...mapActions('funds', ['removeAllFavouriteIsins'])
  }
}
</script>
