<template lang="pug">
  q-page(padding)
    template(v-if="loading")
      .absolute-center.row.items-center.text-purple.gutter-x-lg
        q-spinner-facebook(size="72px" color="purple")
        .q-display-3 Loading

    template(v-else-if="fund")
      // header
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
                @mouseenter.native="hoveringFavouriteIcon = true" @mouseleave.native="hoveringFavouriteIcon = false"
                @click="addToWatchlist(fund.isin)")

        div
          q-fab(flat color="tertiary" icon="more_vert" direction="down")
            q-fab-action(color="pink" icon="fas fa-yen-sign" @click="$router.push({name: 'currency'})")
              q-tooltip(anchor="center left" self="center right" :offset="[20, 0]") Currency View

      // middle section
      fund-info-bar(:fund="fund")
      .row.gutter-x-sm.q-mt-xl
        .col-md-8
          fund-chart(:fund="fund")
        .col-md-4
          fund-holdings(:fund="fund")
      .row.gutter-x-sm.q-mt-sm
        fund-charges(:fund="fund")

      // modal with extra information
      q-modal(v-model="showModal" :content-css="{width: '80vw'}")
        q-icon.absolute-top-right.z-top(name="cancel" v-close-overlay)
        router-view

    template(v-else)
      .absolute-center.row.items-center.gutter-x-sm.text-red
        q-icon(name="error" color="error" size="144px")
        .q-display-4 Sorry! Error loading fund
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
      const fund = await vm.lazyGet(to.params.isin)
      vm.loading = false
      vm.addToRecentlyViewed({isin: fund.isin, name: fund.name})
    })
  },
  async beforeRouteUpdate (to, from, next) {
    next()
    if (to.params.isin !== from.params.isin) {
      this.loading = true
      const fund = await this.lazyGet(to.params.isin)
      this.loading = false
      this.addToRecentlyViewed({isin: fund.isin, name: fund.name})
    }
  },
  data () {
    return {
      loading: true,
      hoveringFavouriteIcon: false,
      showModal: false
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
    ...mapActions('account', ['addToRecentlyViewed', 'addToWatchlist']),
    ...mapGetters('account', ['inWatchlist']),
    ...mapActions('funds', [ 'get', 'lazyGet' ]),
    ...mapGetters('funds', [ 'lookupFund' ]),
    async refreshFund () {
      this.loading = true
      await this.get(this.isin)
      this.loading = false
    },
    onFavouriteIconHovering (isMouseEnter) {
      this.hoveringFavouriteIcon = isMouseEnter
    }
  }
}
</script>
