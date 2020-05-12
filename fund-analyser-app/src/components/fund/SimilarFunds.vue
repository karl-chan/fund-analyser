<template lang="pug">
  q-table(title="Similar Funds" :data="rowData" :columns="columns"
          dense row-key="isin" :hide-bottom="!!rowData.length"
          no-data-label="No similar funds.")
    template(v-slot:body="props")
      q-tr(:props="props" :class="isCurrentFund(props)? 'highlight': undefined")
        q-td(key="isin" :props="props")
          | {{ props.row.isin }}
          q-btn(v-if="!isCurrentFund(props)" icon="open_in_new" color="secondary"
                flat dense @click="openFundPage(props.row.isin)")
          span(v-else)  (Current)
        q-td(key="afterFeesReturn" :props="props")
          | {{ $utils.format.formatPercentage(props.row.afterFeesReturn, true) }}

</template>

<script>
import { mapGetters } from 'vuex'
import orderBy from 'lodash/orderBy'
export default {
  name: 'SimilarFunds',
  props: ['fund'],
  data () {
    return {
      columns: [
        { name: 'isin', label: 'ISIN', field: 'isin', align: 'left', sortable: true },
        { name: 'afterFeesReturn', label: 'After Fees Return', field: 'afterFeesReturn', sortable: true }
      ]
    }
  },
  computed: {
    ...mapGetters('funds', ['lookupSimilarFund']),
    rowData: function () {
      const similarFundsEntry = this.lookupSimilarFund(this.fund.isin)
      if (!similarFundsEntry) {
        return []
      }
      const allSimilarFunds = similarFundsEntry.similarIsins.flatMap(isin => this.lookupSimilarFund(isin))
      const sortedSimilarFunds = orderBy(allSimilarFunds, 'afterFeesReturn', 'desc')
      return sortedSimilarFunds
    }
  },
  methods: {
    isCurrentFund (props) {
      return props.row.isin === this.fund.isin
    },
    openFundPage (isin) {
      this.$utils.router.redirectToFund(isin, { newTab: true })
    }
  }
}
</script>

<style lang="stylus" scoped>
.highlight
  background-color $pink
  color white
</style>
