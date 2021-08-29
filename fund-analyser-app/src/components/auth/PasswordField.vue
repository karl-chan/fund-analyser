<template lang="pug">
q-input(:type="reveal? 'text': 'password'"
        :value="value" v-bind="$attrs" v-on="$listeners")
  template(v-slot:prepend)
    slot(name="prepend")
  template(v-slot:append)
    q-icon.cursor-pointer(:name="reveal? 'visibility_off': 'visibility'" @click="toggleReveal")
  slot
</template>

<script>
export default {
  name: 'PasswordField',
  inheritAttrs: false,
  props: ['value'],
  data () {
    return {
      reveal: false
    }
  },
  methods: {
    toggleReveal () {
      this.reveal = !this.reveal
    }
  }
}
</script>
