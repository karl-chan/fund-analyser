<template lang="pug">
q-select.shadow-2(v-model="selected" :label="placeholder" use-input
                  :use-chips="useChips" :multiple="multiple"
                  bg-color="grey-2" color="accent" filled clearable dense
                  :options="options" @filter="search" @update:model-value="onSelect" @clear="onClear"
                  :input-debounce="250")
  template(v-slot:prepend)
    q-icon(name="search")
  template(v-slot:option="scope")
    q-item(v-bind="scope.itemProps")
      q-item-section
        q-item-label(v-html="scope.opt.label")
        q-item-label(caption) {{ scope.opt.sublabel }}
</template>

<script>
import isEqual from 'lodash/isEqual'

export default {
  name: 'StockSearch',
  props: ['placeholder', 'multiple', 'use-chips', 'value'],
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
      const response = await this.$services.stock.search(term)
      const results = response.map(r => ({ label: r.name, sublabel: r.symbol, value: r.name, stock: r }))
      done(() => {
        this.options = results
      })
    },
    onSelect (item) {
      if (Array.isArray(item)) {
        this.$emit('input', item.map(e => e.stock.symbol)) // multiple mode
      } else {
        this.$emit('input', item && item.stock.symbol) // single mode
      }
    },
    onClear () {
      this.$emit('input', null)
    },
    input (text) {
      this.$emit('keystroke', text)
    }
  },
  watch: {
    value: {
      immediate: true,
      async handler (newValue, oldValue) {
        if (isEqual(newValue, oldValue)) {
          return
        }
        if (!newValue) {
          this.selected = null
        }
        if (Array.isArray(newValue)) {
          const symbols = newValue
          const response = await this.$services.stock.list(symbols)
          this.selected = response.stocks.map(stock => ({ label: stock.name, sublabel: stock.symbol, value: stock.name, stock }))
        } else if (newValue) {
          const symbol = newValue
          const response = await this.$services.stock.list([symbol])
          this.selected = response.stocks.map(stock => ({ label: stock.name, sublabel: stock.symbol, value: stock.name, stock }))[0]
        } else {
          this.selected = null
        }
      }
    }
  }
}
</script>
