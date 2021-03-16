
<template lang="pug">
  q-select.shadow-2(v-model="selected" :label="placeholder" use-input
                    bg-color="grey-2" color="accent" filled clearable dense
                    :options="options" @filter="search" @input="onSelect" @clear="onClear"
                    :input-debounce="250")
    template(v-slot:prepend)
      q-icon(name="search")
    template(v-slot:option="scope")
      q-item(v-bind="scope.itemProps" v-on="scope.itemEvents")
        q-item-section
          q-item-label(v-html="scope.opt.label")
          q-item-label(caption) {{ scope.opt.sublabel }}
</template>

<script>
import flatten from 'lodash/flatten'
import orderBy from 'lodash/orderBy'

export default {
  name: 'CompositeSearch',
  props: ['placeholder'],
  data () {
    return {
      selected: null,
      options: null
    }
  },
  methods: {
    async search (term, done) {
      if (!term) {
        this.input('')
        return
      }
      this.input(term)
      const [res1, res2] = await Promise.all([
        this.$services.fund.search(term),
        this.$services.stock.search(term)
      ])
      const results =
        orderBy(
          flatten([
            res1.map(r => ({ label: r.name, sublabel: r.isin, value: r.name, score: r.score, type: 'fund' })),
            res2.map(r => ({ label: r.name, sublabel: r.symbol, value: r.name, score: r.score, type: 'stock' }))
          ]),
          'score',
          'desc'
        )
      done(() => {
        this.options = results
      })
    },
    onSelect (item) {
      this.$emit('input', {
        isin: item.type === 'fund' ? item.sublabel : undefined,
        symbol: item.type === 'stock' ? item.sublabel : undefined
      })
    },
    onClear () {
      this.$emit('input', { isin: undefined, symbol: undefined })
    },
    input (text) {
      this.$emit('keystroke', text)
    }
  }
}
</script>
