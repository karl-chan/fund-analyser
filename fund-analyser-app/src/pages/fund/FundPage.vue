<template lang="pug">
  q-page(padding)
    template(v-if="fund")
      .q-headline {{fund.name}}
      fund-info-bar(:fund="fund" :realTimeDetails="realTimeDetails")
      div(style="width: 70vw")
        fund-chart(:fund="fund")
      fund-holdings(v-if="realTimeDetails" :realTimeDetails="realTimeDetails")
    template(v-else)
      span.absolute-center.text-grey-14 No Fund Selected
</template>

<script>
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
  computed: {
    fund: function () {
      return this.lookupFund()(this.isin)
    },
    realTimeDetails: function () {
      return this.lookupRealTimeDetails()(this.isin)
    }
  },
  methods: {
    ...mapActions(
      'funds', [
        'get',
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
    lazyGet (isin) {
      if (this.fund && this.fund.isin === isin) {
        return
      }
      this.get(isin)
    }
  }
}
</script>

<style>
</style>
