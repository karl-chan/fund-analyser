<template lang="pug">
  q-search.shadow-2(v-model="input" :placeholder="placeholder" color="grey-2" inverted-light clearable)
    q-autocomplete(@search="search" @selected="selected"
                  :max-results="5000" :debounce="150")
</template>

<script>
export default {
  name: 'FundSearch',
  props: ['placeholder'],
  data () {
    return {
      input: ''
    }
  },
  methods: {
    async search (term, done) {
      this.$emit('input', term)

      const response = await this.$services.fund.search(term)
      const results = response.map(r => ({ label: r.name, sublabel: r.isin, value: r.name, fund: r }))
      done(results)
    },
    selected (item) {
      this.$emit('select', item.fund)
    }
  }
}
</script>
