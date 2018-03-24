<template lang="pug">
  q-input.shadow-2(v-model="selectedItem" :placeholder="placeholder" :before="[{icon: 'search', handler () {}}]"
                   @input="input" color="grey-2" inverted-light clearable)
    q-autocomplete(@search="search" @selected="selected" :max-results="5000")
</template>

<script>
export default {
  name: 'fund-search',
  props: ['placeholder'],
  data () {
    return {
      selectedItem: undefined
    }
  },
  methods: {
    search (term, done) {
      this.$services.fundService.search(term).then(results =>
        results.map(r => ({ label: r.name, sublabel: r.isin, value: r.name, fund: r }))
      ).then(done)
    },
    selected (item) {
      this.$emit('select', item.fund)
    },
    input (text) {
      this.$emit('input', text)
    }
  }
}
</script>
