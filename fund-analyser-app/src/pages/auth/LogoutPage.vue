<template lang="pug">
q-page(padding)
  q-dialog(:value="true" persistent)
    q-card
      q-card-section
        .text-h6 Logging out
      q-card-section
        .row.justify-center.items-center.q-gutter-x-sm
          q-spinner-facebook(size="28px" color="secondary")
          .text-subtitle1 Just a moment
</template>

<script>
import { mapActions } from 'vuex'
export default {
  name: 'LogoutPage',
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.beginLogout()
    })
  },
  methods: {
    async beginLogout () {
      await this.logout()
      this.$utils.router.redirectToHome()
    },
    ...mapActions('auth', ['logout'])
  }
}
</script>
