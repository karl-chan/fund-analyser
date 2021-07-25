<template lang="pug">
table.bg-grey-2(style="border-spacing: 20px 0").border-radius
  tr
    td(v-for="(periodReturn, period) in statement.returns" :key="period")
      div {{period}}
  tr
    td(v-for="(periodReturn, period) in statement.returns" :key="period")
      .text-weight-bold(:class="$utils.format.colourNumber(periodReturn)") {{ $utils.format.formatPercentage(periodReturn) }}
</template>

<script>
export default {
  name: 'AccountReturnsBar',
  props: ['statement']
}
</script>
