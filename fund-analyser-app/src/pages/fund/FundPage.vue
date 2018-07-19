<template lang="pug">
  q-page(padding)
    template(v-if="fund && !refreshing")
      .row.items-center.gutter-sm.q-mb-md
        .q-headline {{fund.name}}
        div
          q-btn(icon="autorenew" label="Renew" @click="refreshFund" color="secondary" rounded glossy)
        div
          q-btn(color="orange" icon="open_in_new" label="Open in FT" @click="openURL('https://markets.ft.com/data/funds/tearsheet/summary?s=' + fund.isin)")
        div
          q-btn(color="indigo-7" icon="open_in_new" label="Open in CSD" @click="openURL('https://www.charles-stanley-direct.co.uk/ViewFund?Sedol=' + fund.sedol)")
        div
          q-icon.q-ml-md(v-if="isFavourite" color="amber" name="star" size="40px")
          q-btn(v-else flat round color="amber" size="xl" :icon="favouriteIcon"
                @mouseenter.native="hoveringFavouriteIcon = true" @mouseleave.native="hoveringFavouriteIcon = false")

      fund-info-bar(:fund="fund")
      .row.gutter-x-sm.q-mt-xl
        .col-md-8
          fund-chart(:fund="fund")
        .col-md-4
          fund-holdings(:fund="fund")
      .row.q-mt-sm
        fund-charges(:fund="fund")
    template(v-else)
      .absolute-center.row.items-center.gutter-x-sm.text-purple
        q-spinner-facebook(size="36px" color="purple")
        .q-title Loading
</template>

<script>
import { openURL } from 'quasar'
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'FundPage',
  props: ['isin'],
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.lazyGet(to.params.isin)
    })
  },
  beforeRouteUpdate (to, from, next) {
    next()
    this.lazyGet(to.params.isin)
  },
  data () {
    return {
      refreshing: false,
      hoveringFavouriteIcon: false
    }
  },
  computed: {
    fund: function () {
      return this.lookupFund()(this.isin)
    },
    isFavourite: function () {
      return this.inWatchlist()(this.isin)
    },
    favouriteIcon: function () {
      return this.isFavourite || this.hoveringFavouriteIcon ? 'star' : 'star_outline'
    }
  },
  methods: {
    openURL,
    ...mapActions('funds', [ 'get', 'lazyGet', 'startRealTimeUpdates', 'stopRealTimeUpdates' ]),
    ...mapGetters('funds', [ 'lookupFund' ]),
    ...mapGetters('account', ['inWatchlist']),
    async refreshFund () {
      this.refreshing = true
      await this.get(this.isin)
      this.refreshing = false
    },
    onFavouriteIconHovering (isMouseEnter) {
      this.hoveringFavouriteIcon = isMouseEnter
    }
  }
}
</script>
