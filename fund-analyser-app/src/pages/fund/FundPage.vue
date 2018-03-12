<template>
  <q-page padding>
    <div v-if="fund" class="q-headline">{{fund.name}}</div>
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
    <fund-real-time-details :fund="fund" @broadcast="onRealTimeDetails" />
  </q-page>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { openURL } from 'quasar'

export default {
  name: 'fund-page',
  props: ['isin'],
  beforeRouteEnter (to, from, next) {
    next(vm => vm.loadData(to.params.isin))
  },
  beforeRouteUpdate (to, from, next) {
    this.loadData(to.params.isin)
    next()
  },
  data: function () {
    return {
      realTimeDetails: undefined
    }
  },
  computed: {
    fund: function () {
      return this.lookupFund()(this.isin)
    }
  },
  methods: {
    ...mapActions(
      'funds', {
        loadData: 'get'
      }
    ),
    ...mapGetters(
      'funds', [
        'lookupFund'
      ]
    ),
    openURL,
    onRealTimeDetails (realTimeDetails) {
      this.realTimeDetails = realTimeDetails
    }
  }
}
</script>

<style>
</style>
