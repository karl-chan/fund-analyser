<template lang="pug">
  .column.gutter-y-sm(v-if="fund")
    .row.gutter-x-sm
      div
        q-chip(square :color="colourNumberChip(fund.entryCharge)")
          | Entry charge: {{ formatPercentage(fund.entryCharge) }}
      div
        q-chip(square :color="colourNumberChip(fund.exitCharge)")
          | Exit charge: {{ formatPercentage(fund.exitCharge) }}
      div
        q-chip(square :color="colourNumberChip(fund.bidAskSpread)")
          | Bid-Ask spread: {{ formatPercentage(fund.bidAskSpread) }}
    .row.gutter-x-sm
      div
        q-chip(square color="red") AMC: {{ formatPercentage(fund.amc) }}
      div
        q-chip(square color="red") OCF: {{ formatPercentage(fund.ocf) }}
      div
        q-chip(square :color="colourType(fund.type)") {{ fund.type }}
      div
        q-chip(square :color="colourFrequency(fund.frequency)") {{ fund.frequency }}

</template>

<script>
export default {
  name: 'FundCharges',
  props: ['fund'],
  methods: {
    colourNumberChip (num) {
      return num > 0 ? 'red' : 'green'
    },
    colourType (type) {
      return type === 'OEIC' ? 'green' : 'red'
    },
    colourFrequency (freq) {
      return freq === 'Daily' ? 'green' : 'red'
    },
    formatPercentage (num) {
      return this.$utils.format.formatPercentage(num, true)
    }
  }
}
</script>
