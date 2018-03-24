<template lang="pug">
  transition(leave-active-class="animated fadeOutUp")
    q-alert(v-if="visible" :actions="[{ icon: 'close', handler: () => { visible = false } }]"
            icon="lightbulb_outline" color="amber" :message="randomTip" detail="Tip of the day")
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
  beforeDestroy () {
    clearInterval(this.refreshJobId)
  },
  computed: {
    ...mapState('misc', [
      'tips'
    ])
  },
  methods: {
    swapTipOfTheDay () {
      if (this.tips.length) {
        this.randomTip = this.tips[++this.currentTipIndex % this.tips.length]
      }
    }
  }
}
</script>

<style>
</style>
