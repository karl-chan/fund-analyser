<template lang="pug">
  q-page(padding)
    q-dialog(:value="true" prevent-close)
      span(slot="title") Logging out
      .row.justify-center.items-center.gutter-x-sm(slot="body")
        q-spinner-facebook(size="28px" color="secondary")
        .q-subheading Just a moment
      template(slot="buttons" slot-scope="props")
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
