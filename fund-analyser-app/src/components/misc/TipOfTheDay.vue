<template lang="pug">
transition(leave-active-class="animated fadeOutUp")
  q-banner.bg-amber.text-white.q-pa-xs(v-if="visible" inline-actions)
    template(v-slot:avatar)
      q-icon(name="lightbulb_outline" size="md")
    q-item
      q-item-section
        q-item-label.text-subtitle1 {{ randomTip }}
        q-item-label(caption) Tip of the day
    template(v-slot:action)
      q-btn(flat icon="close" @click="closeTipOfTheDay")
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'TipOfTheDay',
  data () {
    return {
      refreshJobId: null,
      refreshInterval: 10000, // 10 seconds
      currentTipIndex: -1,
      randomTip: 'No tips available',
      visible: true
    }
  },
  created () {
    this.swapTipOfTheDay()
    this.refreshJobId = setInterval(this.swapTipOfTheDay, this.refreshInterval)
  },
  beforeUnmount () {
    clearInterval(this.refreshJobId)
  },
  computed: {
    ...mapState('admin', [
      'tips'
    ])
  },
  methods: {
    swapTipOfTheDay () {
      if (this.tips.length) {
        this.randomTip = this.tips[++this.currentTipIndex % this.tips.length]
      }
    },
    closeTipOfTheDay () {
      this.visible = false
    }
  }
}
</script>
