<template lang="pug">
  .shadow-5.container(v-if="fund")
    .row.items-center.gutter-x-xl
      .q-display-1 Indicators
      div
        q-input(v-model="filter" float-label="Filter by property" inverted color="tertiary"
              :before="[{icon: 'fas fa-filter', handler () {}}]")
    .q-mt-lg
      q-tree(:nodes="indicatorNodes" color="tertiary" text-color="white" default-expand-all
           :filter="filter" :filter-method="filterMethod" node-key="key" :no-results-label="noMatchLabel")
</template>

<script>
import isPlainObject from 'lodash/isPlainObject'
export default {
  name: 'FundIndicators',
  props: ['fund'],
  data: function () {
    return {
      filter: ''
    }
  },
  computed: {
    indicatorNodes: function () {
      return this.toNodes(this.fund.indicators)
    },
    noMatchLabel: function () {
      return 'No indicators matching: ' + this.filter
    }
  },
  methods: {
    toNodes (indicators) {
      const nodes = []
      for (let [k, v] of Object.entries(indicators)) {
        if (isPlainObject(v)) {
          const innerNodes = this.toNodes(v)
            .map(node => ({ ...node, key: `${k}.${node.key}` }))
          nodes.push({ key: k, label: this.sentenceCase(k), children: innerNodes })
        } else {
          nodes.push({ key: k, label: `${this.sentenceCase(k)}: ${this.$utils.format.formatNumber(v)}` })
        }
      }
      return nodes
    },
    filterMethod (node, filter) {
      return node.key.toLowerCase().includes(filter.toLowerCase())
    },
    sentenceCase (str) {
      return str.charAt(0).toUpperCase() + str.slice(1)
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '~variables'

.container
  padding 30px
  border-radius 10px
  background-color goldenrod
  color white

</style>
