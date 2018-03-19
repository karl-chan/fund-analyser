<template lang="pug">
  q-search.shadow-2(v-model="selectedItem" placeholder="Start typing a fund name" color="grey-2" inverted-light="" clearable="")
    q-autocomplete(@search="search" @selected="selected" :max-results="5000")
</template>

<script>
export default {
  name: 'fund-search',
  data: function () {
    return {
      selectedItem: undefined
    }
  },
  methods: {
    search (term, done) {
      this.$services.fundService.search(term).then(results =>
        results.map(r => ({ label: r.name, sublabel: r.isin, value: r.isin }))
      ).then(done)
    },
    selected (item) {
      this.$router.push({ name: 'fund', params: { isin: item.value } })
    }
  }
}
</script>
