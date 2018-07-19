<template lang="pug">
  div
    q-list-header Recently Viewed
            q-btn.q-ml-xl(label="Clear all" color="red" @click="removeAll" dense)
    q-item(v-for="fund in funds" :to="{name: 'fund', params: {isin: fund.isin}}" :key="fund.isin")
      q-item-main(:label="fund.name" :sublabel="fund.isin")
      q-item-side(right)
        q-icon(v-if="inWatchlist(fund)" name="star" color="amber" size="24px")
        q-btn(v-else flat round dense icon="close" @click.stop="remove(fund.isin)")
</template>

<script>
import { mapActions, mapState } from 'vuex'
export default {
  name: 'RecentlyViewedList',
  props: ['funds', 'watchlist'],
  computed: {
    ...mapState('funds', {
      loadedFunds: 'loaded'
    })
  },
  methods: {
    ...mapActions('funds', ['remove', 'removeAll']),
    inWatchlist (fund) {
      if (this.watchlist && this.watchlist.length) {
        return this.watchlist.includes(fund.isin)
      }
      return false
    }
  }
}
</script>
