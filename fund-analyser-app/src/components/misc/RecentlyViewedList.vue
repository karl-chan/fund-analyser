<template lang="pug">
  div
    q-list-header Recently Viewed
            q-btn.q-ml-xl(label="Clear all" color="red" @click="clearRecentlyViewed" dense)
    q-item(v-for="entry in recentlyViewed" :to="{name: 'fund', params: {isin: entry.isin}}" :key="entry.isin")
      q-item-main(:label="entry.name" :sublabel="entry.isin")
      q-item-side(right)
        q-btn(flat round dense icon="close" @click.stop="removeFromRecentlyViewed(entry.isin)")
</template>

<script>
import { mapActions, mapState } from 'vuex'
export default {
  name: 'RecentlyViewedList',
  computed: {
    ...mapState('account', ['recentlyViewed'])
  },
  methods: {
    ...mapActions('account', ['removeFromRecentlyViewed', 'clearRecentlyViewed'])
  }
}
</script>
