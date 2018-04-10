<template lang="pug">
  q-page.column.gutter-y-md(padding)
    div(v-if="user")
      account-balance(:user="user" :balance="balance")
    div
      .q-headline Summary
      funds-table
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
export default {
  name: 'HomePage',
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.getBalance()
    })
  },
  computed: {
    balance: function () {
      return this.lookupBalance()
    },
    ...mapState('auth', ['user'])
  },
  methods: {
    ...mapActions('account', [ 'getBalance' ]),
    ...mapGetters('account', [ 'lookupBalance' ])
  }
}
</script>
