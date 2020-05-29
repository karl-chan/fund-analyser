<template lang="pug">
  q-select.shadow-2(v-model="selected" :label="placeholder" use-input
                    :use-chips="useChips" :multiple="multiple"
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
import isEqual from 'lodash/isEqual'

export default {
  name: 'FundSearch',
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
      const response = await this.$services.fund.search(term)
      const results = response.map(r => ({ label: r.name, sublabel: r.isin, value: r.name, fund: r }))
      done(() => {
        this.options = results
      })
    },
    onSelect (item) {
      if (Array.isArray(item)) {
        this.$emit('input', item.map(e => e.fund.isin)) // multiple mode
      } else {
        this.$emit('input', item && item.fund.isin) // single mode
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
          const isins = newValue
          const response = await this.$services.fund.list(isins)
          this.selected = response.funds.map(fund => ({ label: fund.name, sublabel: fund.isin, value: fund.name, fund }))
        } else if (newValue) {
          const isin = newValue
          const response = await this.$services.fund.list([isin])
          this.selected = response.funds.map(fund => ({ label: fund.name, sublabel: fund.isin, value: fund.name, fund }))[0]
        } else {
          this.selected = null
        }
      }
    }
  }
}
</script>
