<template lang="pug">
  q-page(padding)
    template(v-if="loading")
      .absolute-center.row.items-center.text-purple.q-gutter-x-lg
        q-spinner-facebook(size="72px" color="purple")
        .text-h3 Loading

    template(v-else-if="fund")
      // header
      .row.items-center.q-gutter-sm.q-mb-md
        .text-h5 {{fund.name}}
        div
          q-btn(icon="autorenew" label="Renew" @click="refreshFund" color="secondary" rounded glossy)
        div
          q-btn(color="orange" icon="open_in_new" label="Open in FT" @click="openURL('https://markets.ft.com/data/funds/tearsheet/summary?s=' + fund.isin)")
        div
          q-btn(color="indigo-7" icon="open_in_new" label="Open in CSD" @click="openURL('https://www.charles-stanley-direct.co.uk/ViewFund?Sedol=' + fund.sedol)")
        div
          q-btn(flat round color="amber" size="xl" :icon="favouriteIcon"
                @mouseenter.native="hoveringFavouriteIcon = true" @mouseleave.native="hoveringFavouriteIcon = false"
                @click="toggleWatchlist(fund.isin)")
            q-tooltip {{ isFavourite? 'Remove from watch list' : 'Add to watch list' }}

      // middle section
      fund-info-bar(:fund="fund")
      .row.q-col-gutter-x-sm.q-mt-xl
        .col-md-8.q-gutter-y-md
          fund-chart(:fund="fund")
          fund-charges(:fund="fund")
        .col-md-4.q-gutter-y-xs
          fund-holdings(:fund="fund")
          similar-funds(:fund="fund")
      .row.q-col-gutter-x-sm.q-mt-sm
        .col-md-5
          fund-currency-view(:fund="fund")
        .col-md-7
          fund-indicators(:fund="fund")

    template(v-else)
      .absolute-center.row.items-center.q-gutter-x-sm.text-red
        q-icon(name="error" color="error" size="144px")
        .text-h2 Sorry! Error loading fund
</template>

<script>
import { openURL } from 'quasar'
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'FundPage',
  props: ['isin'],
  beforeRouteEnter (to, from, next) {
    next(async vm => {
      vm.loading = true
      const funds = await vm.lazyGets([to.params.isin])
      vm.loading = false
      funds.forEach(fund => vm.addToRecentlyViewed({ isin: fund.isin, name: fund.name }))
    })
  },
  async beforeRouteUpdate (to, from, next) {
    next()
    if (to.params.isin !== from.params.isin) {
      this.loading = true
      const funds = await this.lazyGets([to.params.isin])
      this.loading = false
      funds.forEach(fund => this.addToRecentlyViewed({ isin: fund.isin, name: fund.name }))
    }
  },
  data () {
    return {
      loading: true,
      hoveringFavouriteIcon: false
    }
  },
  computed: {
    ...mapGetters('account', ['inWatchlist']),
    ...mapGetters('funds', ['lookupFund']),
    fund: function () {
      return this.lookupFund(this.isin)
    },
    isFavourite: function () {
      return this.inWatchlist(this.isin)
    },
    favouriteIcon: function () {
      return this.isFavourite ^ this.hoveringFavouriteIcon ? 'star' : 'star_outline'
    }
  },
  methods: {
    openURL,
    ...mapActions('account', ['addToRecentlyViewed', 'addToFundWatchlist', 'removeFromFundWatchlist']),
    ...mapActions('funds', ['gets', 'lazyGets']),
    async refreshFund () {
      this.loading = true
      await this.gets([this.isin])
      this.loading = false
    },
    onFavouriteIconHovering (isMouseEnter) {
      this.hoveringFavouriteIcon = isMouseEnter
    },
    toggleWatchlist (isin) {
      this.isFavourite ? this.removeFromFundWatchlist(isin) : this.addToFundWatchlist(isin)
    }
  }
}
</script>
