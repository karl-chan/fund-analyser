<template lang="pug">
.column.q-gutter-y-xs
  .text-h4.text-grey
    template(v-if="user") Hello {{user}}
    template(v-else) Hello guest, you are not logged in!

  // Account balance
  account-balance(v-if="balance" :balance="balance")
    template(v-slot:toolbar="")
      .row.q-gutter-x-lg
        account-returns-bar(:statement="statement")
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
