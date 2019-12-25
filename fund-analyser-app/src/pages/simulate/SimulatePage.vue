<template lang="pug">
  q-page(padding)
    .row.q-gutter-x-md
      .col
        .text-h5 Simulator
        simulate-request(:init-simulate-param="simulateParam" ref="simulateRequest"
                         @response="onResponse")
        template(v-if="response")
          account-returns-bar(:statement="response.simulation.simulateResponse.statement")
          simulate-response(:simulate-response="response.simulation.simulateResponse")

      .col
        template(v-if="response")
          simulate-prediction(:prediction="response.prediction" :simulation="response.simulation")
          account-statement(:statement="response.simulation.simulateResponse.statement")

</template>

<script>
export default {
  name: 'SimulatePage',
  beforeRouteEnter (to, from, next) {
    next(async vm => {
      try {
        vm.simulateParam = JSON.parse(to.params.simulateParam)
        setTimeout(vm.$refs.simulateRequest.onSubmit, 250)
      } catch (ignored) {}
    })
  },
  async beforeRouteUpdate (to, from, next) {
    next()
    try {
      this.simulateParam = JSON.parse(to.params.simulateParam)
      setTimeout(this.$refs.simulateRequest.onSubmit, 250)
    } catch (ignored) {}
  },
  data () {
    return {
      simulateParam: null,
      response: null
    }
  },
  methods: {
    async onResponse (response) {
      this.response = response
    }
  }
}
</script>
