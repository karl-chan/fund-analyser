<template lang="pug">
  q-page(padding)
    funds-summary(:summary="summary" :summaryRequestHandler="getSummary")
</template>

<script>
import { mapActions, mapState } from 'vuex'

export default {
  name: 'FundsSummaryPage',
  computed: {
    ...mapState('funds', ['favouriteIsins', 'summary'])
  },
  methods: {
    ...mapActions('funds', ['getSummary', 'gets'])
  }
}
</script>
