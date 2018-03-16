<template>
  <q-page padding>
    <template v-if="fund">
      <div class="q-headline">{{fund.name}}</div>
      <div class="row justify-between items-center">
        <!-- real time details bar -->
        <template v-if="realTimeDetails">
          <div>Today's change (estimate):
            <span :class="{'text-green': realTimeDetails.estChange > 0,
                          'text-red': realTimeDetails.estChange < 0,
                          'text-weight-bold': true,
                          'q-headline': true}">
              {{ $utils.formatUtils.formatPercentage(realTimeDetails.estChange, true) }}
            </span>
          </div>
          <div>Std dev: {{ $utils.formatUtils.formatPercentage(realTimeDetails.stdev, true) }}</div>
          <div>Confidence interval:
            ({{ $utils.formatUtils.formatPercentage(realTimeDetails.ci[0], true) }},
            {{ $utils.formatUtils.formatPercentage(realTimeDetails.ci[1], true) }} )
            </div>
        </template>

        <q-btn color="amber" icon="open_in_new" label="Open in FT" @click="openURL('https://markets.ft.com/data/funds/tearsheet/summary?s=' + fund.isin)" />
      </div>
      <div style="width: 70vw">
        <fund-chart :fund="fund"/>
      </div>
      <fund-holdings v-if="realTimeDetails" :realTimeDetails="realTimeDetails" />
    </template>
    <template v-else>
      <span class="absolute-center text-grey-14">No Fund Selected</span>
    </template>
  </q-page>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { openURL } from 'quasar'

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
    openURL,
    lazyGet (isin) {
      if (!this.fund) {
        this.get(isin)
      }
    }
  }
}
</script>

<style>
</style>
