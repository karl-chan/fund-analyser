<template lang="pug">
  .column.q-gutter-y-xs
    .text-h4.text-grey
      template(v-if="user") Hello {{user}}
      template(v-else) Hello guest, you are not logged in!

    // Account balance
    account-balance(v-if="balance" :balance="balance")
      template(slot="toolbar")
        .row.q-gutter-x-lg
          table.bg-grey-2(style="border-spacing: 20px 0").border-radius
            tr
              td(v-for="(periodReturn, period) in statement.returns" :key="period")
                div {{period}}
            tr
              td(v-for="(periodReturn, period) in statement.returns" :key="period")
                .text-weight-bold(:class="$utils.format.colourNumber(periodReturn)") {{ $utils.format.formatPercentage(periodReturn) }}
          div
            q-btn-group
              q-btn(color="accent" icon="open_in_new" @click="openURL('https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts/Portfolio_Valuation')")
                q-tooltip Open in Charles Stanley Direct
              q-btn(color="accent" :icon="showStatement ? 'expand_less' : 'expand_more'" @click="toggleShowStatement")
                q-tooltip {{ showStatement ? 'Hide' : 'Show' }} statement

    // Account orders
    .col.q-mt-xs.q-gutter-y-xs(v-if="orders.length")
      .text-h5 Pending Orders
      account-orders(:orders="orders")

    // Account statement
    q-slide-transition
      div(v-if="showStatement")
        account-statement(v-if="statement" :statement="statement")

</template>

<script>
import { openURL } from 'quasar'
export default {
  name: 'AccountView',
  props: ['user', 'balance', 'orders', 'statement'],
  data () {
    return {
      showStatement: false
    }
  },
  methods: {
    toggleShowStatement () {
      this.showStatement = !this.showStatement
    },
    openURL
  }
}
</script>
