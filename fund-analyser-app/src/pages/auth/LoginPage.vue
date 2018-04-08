<template lang="pug">
  q-page(padding)
    q-dialog(:value="true" @ok="submit" @cancel="cancel")
      span(slot="title") Login
      span(slot="message") Please enter your Charles Stanley Direct credentials
        .text-red(v-if="failureCount")
          .text-weight-bold Failed to login. Attempt: {{failureCount}}.
          div(v-if="exceedsFailureQuota") Account is locked by Charles Stanley Direct for 15 mins.
      div(slot="body")
        q-input(v-model.trim="form.email" @keyup.enter="submit" @blur="$v.form.email.$touch" :error="$v.form.email.$error"
                float-label="Email Address" color="secondary" :before="[{icon: 'mail', handler () {}}]")
        q-input(v-model.trim="form.pass" type="password" @keyup.enter="submit" @blur="$v.form.pass.$touch" :error="$v.form.pass.$error"
                float-label="Password" color="secondary" :before="[{icon: 'security', handler () {}}]")
        q-input(v-model.trim="form.memorableWord" type="password" @keyup.enter="submit" @blur="$v.form.memorableWord.$touch" :error="$v.form.memorableWord.$error"
                float-label="Memorable word" color="secondary" :before="[{icon: 'fas fa-question', handler () {}}]")
        q-checkbox(v-model="form.persist", label="Keep me logged in for a month")

      template(slot="buttons" slot-scope="props")
        q-btn.login.btn(label="Login" :disable="!readyToSubmit" @click="submit")
        q-btn(label="Cancel" @click="cancel" color="negative" outline)

</template>

<script>
import { mapActions } from 'vuex'
import { required, email, minLength } from 'vuelidate/lib/validators'
export default {
  name: 'LoginPage',
  data () {
    return {
      form: {
        email: '',
        pass: '',
        memorableWord: '',
        persist: false
      },
      failureCount: 0
    }
  },
  computed: {
    exceedsFailureQuota: function () {
      return this.failureCount >= 3
    },
    readyToSubmit: function () {
      return !this.$v.form.$invalid
    }
  },
  methods: {
    async submit () {
      if (!this.readyToSubmit) {
        return
      }
      try {
        await this.login({
          user: this.form.email,
          pass: this.form.pass,
          memorableWord: this.form.memorableWord,
          persist: this.form.persist
        })
        this.loginSuccess()
      } catch (err) {
        this.loginFailure()
      }
    },
    loginSuccess () {
      this.failureCount = 0
      this.$utils.router.redirectToHome()
    },
    loginFailure () {
      this.failureCount++
    },
    cancel () {
      this.$utils.router.redirectToHome()
    },
    ...mapActions('auth', ['login'])
  },
  validations: {
    form: {
      email: {
        required, email
      },
      pass: {
        required
      },
      memorableWord: {
        required,
        minLength: minLength(8)
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.login.btn {
  background: goldenrod;
  color: white;
}
</style>
