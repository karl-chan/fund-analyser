<template lang="pug">
.row.inline.justify-between.items-center.q-py-md.q-pr-md.q-gutter-x-md.bg-blue-grey.text-white.shadow-1
  .row.items-center.q-gutter-x-sm
    .dot(:class="getColour(health.charlesStanleyDirect)")
    div Charles Stanley Direct
  .row.items-center.q-gutter-x-sm
    .dot(:class="getColour(health.testsPassing)")
    div Tests

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
  beforeUnmount () {
    if (this.poller) {
      clearInterval(this.poller)
    }
  }
}
</script>

<style lang="scss" scoped>
.dot {
  height: 10px;
  width: 10px;
  border-radius: 50%;
  display: inline-block;
}
</style>
