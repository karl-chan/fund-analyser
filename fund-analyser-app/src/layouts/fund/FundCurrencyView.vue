<template lang="pug">
  .row
    .col-md-8
      q-toolbar

    .col-md-4
      currency-exposure(:holdings="holdings")
</template>

<script>
import get from 'lodash/get'
export default {
  name: 'FundCurrencyView',
  props: ['fund'],
  computed: {
    holdings: function () {
      return get(this.fund, 'realTimeDetails.holdings', [])
    }
  }
}
</script>
