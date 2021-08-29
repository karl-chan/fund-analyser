<template lang="pug">
.column.q-gutter-y-sm(v-if="fund")
  .row.q-gutter-x-sm
    div
      q-chip(square :color="colourNumberChip(fund.entryCharge)" text-color="white")
        | Entry charge: {{ formatPercentage(fund.entryCharge) }}
    div
      q-chip(square :color="colourNumberChip(fund.exitCharge)" text-color="white")
        | Exit charge: {{ formatPercentage(fund.exitCharge) }}
    div
      q-chip(square :color="colourNumberChip(fund.bidAskSpread)" text-color="white")
        | Bid-Ask spread: {{ formatPercentage(fund.bidAskSpread) }}
  .row.q-gutter-x-sm
    div
      q-chip(square color="red" text-color="white") AMC: {{ formatPercentage(fund.amc) }}
    div
      q-chip(square color="red" text-color="white") OCF: {{ formatPercentage(fund.ocf) }}
    div
      q-chip(square :color="colourType(fund.type)" text-color="white") {{ fund.type }}
    div
      q-chip(square :color="colourFrequency(fund.frequency)" text-color="white") {{ fund.frequency }}

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
