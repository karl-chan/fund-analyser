<template lang="pug">
  q-select.shadow-2(v-model="userInput" :label="placeholder" use-input
                    bg-color="grey-2" color="accent" filled clearable dense
                    :options="options" @filter="search" @input="selected" :input-debounce="150")
    template(v-slot:prepend)
      q-icon(name="search")
    template(v-slot:option="scope")
      q-item(v-bind="scope.itemProps" v-on="scope.itemEvents")
        q-item-section
          q-item-label(v-html="scope.opt.label")
          q-item-label(caption) {{ scope.opt.sublabel }}
</template>

<script>
export default {
  name: 'FundSearch',
  props: ['placeholder'],
  data () {
    return {
      userInput: '',
      options: null
    }
  },
  methods: {
    async search (term, done) {
      if (!term) {
        this.clear()
        return
      }
      this.input(term)
      const response = await this.$services.fund.search(term)
      const results = response.map(r => ({ label: r.name, sublabel: r.isin, value: r.name, fund: r }))
      done(() => {
        this.options = results
      })
    },
    selected (item) {
      this.$emit('select', item.fund)
    },
    clear () {
      this.input('')
    },
    input (text) {
      this.$emit('input', text)
    }
  }
}
</script>
