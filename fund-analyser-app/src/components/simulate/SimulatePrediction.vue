<template lang="pug">
  .row
    .text-h5 Predictions
    q-btn(icon="info" color="primary" flat round dense @click="openModal = true")
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

    // Modal
    q-dialog(v-model="openModal")
      q-table(title="Details" :data="funds" :columns="columns" row-key="isin")
        template(v-slot:top)
          .col
            .text-h6 Query Details
            ul
              li Strategy: {{simulation.simulateParam.strategy}}
              li Num portfolio: {{simulation.simulateParam.numPortfolio}}
              li Date: {{prediction.date}}
              li Funds:
</template>

<script>
export default {
  name: 'SimulatePrediction',
  props: ['prediction', 'simulation'],
  data () {
    return {
      openModal: false,
      columns: [
        { name: 'isin', label: 'ISIN', field: 'isin', align: 'left' },
        { name: 'name', label: 'Name', field: 'name', align: 'left' }
      ],
      funds: []
    }
  },
  computed: {

  },
  methods: {
    openFundPage (isin) {
      this.$utils.router.redirectToFund(isin, { newTab: true })
    }
  },
  watch: {
    simulation: {
      immediate: true,
      async handler (value) {
        const response = await this.$services.fund.list(value.simulateParam.isins)
        this.funds = response.funds
      }
    }
  }
}
</script>
