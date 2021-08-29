<template lang="pug">
q-page(padding)
  q-dialog(:value="true" @ok="submit" @cancel="cancel")
    q-card
      q-card-section
        .text-h6 Login
      q-card-section Please enter your Charles Stanley Direct credentials
      q-card-section.text-red(v-if="failureCount")
        .text-weight-bold Failed to login. Attempt: {{failureCount}}.
        div(v-if="exceedsFailureQuota") Account is locked by Charles Stanley Direct for 15 mins.
      q-card-section
        q-input(:value="form.email" @input="form.email = $event.toLowerCase().trim()" @keyup.enter="submit" @blur="$v.form.email.$touch" :error="$v.form.email.$error"
                label="Email Address" color="secondary")
          template(v-slot:prepend)
            q-icon(name="mail")
        password-field(v-model.trim="form.pass" @keyup.enter="submit" @blur="$v.form.pass.$touch" :error="$v.form.pass.$error"
                       label="Password" color="secondary")
          template(v-slot:prepend)
            q-icon(name="security")
        password-field(v-model.trim="form.memorableWord" @keyup.enter="submit" @blur="$v.form.memorableWord.$touch" :error="$v.form.memorableWord.$error"
                       label="Memorable word" color="secondary")
          template(v-slot:prepend)
            q-icon(name="fas fa-question")
        q-checkbox(v-model="form.persist", label="Keep me logged in for a month")
      q-card-actions
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

<style lang="scss" scoped>
.login {
  &.btn {
    background: #daa520;
    color: #fff;
  }
}
</style>
