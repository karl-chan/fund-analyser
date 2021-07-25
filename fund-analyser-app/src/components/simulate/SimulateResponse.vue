<template lang="pug">
.col
  .row
    .text-h5 Predictions
    q-btn(icon="info" color="primary" flat round dense @click="openModal")
      q-tooltip
        .row Date: {{prediction.date}}
        .row Click to open

    .row.q-ml-lg
      template(v-if="prediction.funds.length")
        q-chip(v-for="fund in prediction.funds" :key="fund.isin"
              color="primary" text-color="white" clickable
              @click="openFundPage(fund.isin)") {{fund.isin}}
          q-tooltip {{fund.name}}
      q-chip(v-else color="accent" text-color="white") Cash

  .row
    account-statement(:statement="simulation.simulateResponse.statement")

  simulate-response-modal(ref="modal" :prediction="prediction" :simulation="simulation")

</template>

<script>
export default {
  name: 'SimulateResponse',
  props: ['prediction', 'simulation'],
  methods: {
    openFundPage (isin) {
      this.$utils.router.redirectToFund(isin, { newTab: true })
    },
    openModal () {
      this.$refs.modal.open()
    }
  }
}
</script>
