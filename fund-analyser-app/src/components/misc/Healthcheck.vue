<template lang="pug">
  .row.inline.justify-between.items-center.bg-blue-grey.text-white.shadow-1.q-pa-md
    .row.items-center
      .dot(:class="getColour(health.charlesStanleyDirect)")
      .q-ml-md Charles Stanley Direct

</template>

<script>
import { mapState, mapActions } from 'vuex'
export default {
  name: 'Healthcheck',
  created () {
    this.doHealthcheck()
    this.poller = setInterval(this.doHealthcheck, 60000) // 1 minute interval
  },
  data: function () {
    return {
      poller: null
    }
  },
  computed: {
    ...mapState('admin', ['health'])
  },
  methods: {
    ...mapActions('admin', ['doHealthcheck']),
    getColour (status) {
      if (status === undefined || status === null) {
        return 'bg-orange'
      }
      return status ? 'bg-green' : 'bg-red'
    }
  },
  beforeDestroy () {
    if (this.poller) {
      clearInterval(this.poller)
    }
  }
}
</script>

<style lang="stylus" scoped>
.dot
  height 10px
  width 10px
  border-radius 50%
  display inline-block

</style>
