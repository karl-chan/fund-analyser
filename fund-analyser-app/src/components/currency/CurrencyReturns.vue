<template lang="pug">
.row.items-center.q-gutter-xs(v-if="currency")
  div(v-for="(periodReturn, period) in currency.returns" :key="period")
    | {{period}}:
    |
    .text-weight-bold(:class="colour(periodReturn)") {{ formatPercentage(periodReturn) }}
</template>

<script>
export default {
  name: 'CurrencyReturns',
  props: ['currency'],
  methods: {
    colour (num) {
      return this.$utils.format.colourNumber(num)
    },
    formatPercentage (num) {
      return this.$utils.format.formatPercentage(num, true)
    }
  }
}
</script>
