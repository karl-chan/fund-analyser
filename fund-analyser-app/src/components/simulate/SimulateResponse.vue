<template lang="pug">
  .row
    q-chip(square :color="colourNumberChip(simulateResponse.returns)" text-color="white")
      | Total returns: {{ formatPercentage(simulateResponse.returns) }}
    q-chip(square color="red" text-color="white")
      | Max drawdown: {{ formatPercentage(simulateResponse.maxDrawdown) }}
    q-chip(square color="orange" text-color="white")
      | Sharpe ratio: {{ formatNumber(simulateResponse.sharpeRatio) }}
</template>

<script>
export default {
  name: 'SimulateResponse',
  props: ['simulateResponse'],
  methods: {
    colourNumberChip (num) {
      return num > 0 ? 'green' : 'red'
    },
    formatNumber (num) {
      return this.$utils.format.formatNumber(num, true)
    },
    formatPercentage (num) {
      return this.$utils.format.formatPercentage(num, true)
    }
  }
}
</script>
