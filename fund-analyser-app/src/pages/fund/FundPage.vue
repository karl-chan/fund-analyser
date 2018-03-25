<template lang="pug">
  q-page(padding)
    template(v-if="fund && !refreshing")
      .row.items-center.gutter-sm.q-mb-md
        .q-headline {{fund.name}}
        div
          q-btn(icon="autorenew" label="Renew" @click="refreshFund" color="secondary" rounded glossy)
        div
          q-btn(color="amber" icon="open_in_new" label="Open in FT" @click="openURL('https://markets.ft.com/data/funds/tearsheet/summary?s=' + fund.isin)")
      fund-info-bar(:fund="fund" :realTimeDetails="realTimeDetails")
      div(style="width: 70vw")
        fund-chart(:fund="fund")
      fund-holdings(v-if="realTimeDetails" :realTimeDetails="realTimeDetails")
    template(v-else)
      .absolute-center.row.items-center.gutter-x-sm.text-purple
        q-spinner-dots(size="36px" color="purple")
        .q-title Loading
</template>

<script>
import { openURL } from 'quasar'
import { mapActions, mapGetters } from 'vuex'
export default {
  name: 'fund-page',
  props: ['isin'],
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.lazyGet(to.params.isin)
      vm.startRealTimeUpdates(to.params.isin)
    })
  },
  beforeRouteUpdate (to, from, next) {
    this.stopRealTimeUpdates(from.params.isin)
    this.lazyGet(to.params.isin)
    this.startRealTimeUpdates(to.params.isin)
    next()
  },
  beforeRouteLeave (to, from, next) {
    this.stopRealTimeUpdates(from.params.isin)
    next()
  },
  data () {
    return {
      refreshing: false
    }
  },
  computed: {
    fund: function () {
      return this.lookupFund()(this.isin)
    },
    realTimeDetails: function () {
      return this.lookupRealTimeDetails()(this.isin)
    }
  },
  methods: {
    openURL,
    ...mapActions(
      'funds', [
        'get',
        'lazyGet',
        'startRealTimeUpdates',
        'stopRealTimeUpdates'
      ]
    ),
    ...mapGetters(
      'funds', [
        'lookupFund',
        'lookupRealTimeDetails'
      ]
    ),
    async refreshFund () {
      this.refreshing = true
      await this.get(this.isin)
      this.refreshing = false
    }
  }
}
</script>
