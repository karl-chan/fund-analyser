<template lang="pug">
q-dialog(v-model="modalOpen" position="top" @show="onOpen")
  q-card
    q-card-section
      .text-subtitle2 Active Sessions
    q-list(v-for="session in activeSessions" :key="session.encryptedId")
      q-item
        q-item-section(avatar)
          .circle-dot(v-if="session.current")
          q-icon(v-else :name="getDeviceIcon(session)")
          q-tooltip {{ getTooltipText(session) }}
        q-item-section
          q-item-label {{session.location.ip}}
          q-item-label(caption) Location - {{extractLocation(session)}}
        q-item-section(side)
          q-item-label(caption) Expires {{$utils.format.formatFromNow(session.expiry)}}
          q-chip.shadow-2(v-if="session.current" square color="secondary" text-color="white") Current
          q-btn(v-else dense rounded icon="delete" @click="destroySession(session.encryptedId)")

</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'ActiveSessions',
  props: ['open'],
  computed: {
    ...mapState('auth', ['activeSessions']),
    modalOpen: {
      get () {
        return this.open
      },
      set (open) {
        this.$emit('update:open', open)
      }
    }
  },
  methods: {
    ...mapActions('auth', ['getActiveSessions', 'destroySession']),
    onOpen () {
      this.getActiveSessions()
    },
    extractLocation (session) {
      const { city, country, region } = session.location || {}
      if (!city && !country && !region) {
        return 'Unknown'
      }
      return [city, region, country].filter(x => x).join(', ')
    },
    getDeviceIcon (session) {
      const deviceType = session.userAgent && session.userAgent.device && session.userAgent.device.type
      const os = session.userAgent && session.userAgent.os && session.userAgent.os.name
      if (deviceType === 'mobile') {
        switch (os) {
          case 'iOS': return 'phone_iphone'
          case 'Android': return 'phone_android'
          default: return 'smartphone'
        }
      } else if (deviceType === 'tablet') {
        switch (os) {
          case 'Mac OS': // fallthrough
          case 'iOS': return 'tablet_mac'
          case 'Android': return 'tablet_android'
          default: return 'tablet'
        }
      } else if (deviceType === 'smarttv') {
        return 'tv'
      } else if (deviceType === 'wearable') {
        return 'watch'
      } else {
        switch (os) {
          case 'Windows': return 'desktop_windows'
          case 'Mac OS': return 'desktop_mac'
          default: return 'device_unknown'
        }
      }
    },
    getTooltipText (session) {
      const { ua, device, browser, os } = session.userAgent
      const info = []
      if (device.vendor && device.model) {
        info.push(`${device.vendor} ${device.model}`)
      }
      if (os.name && os.version) {
        info.push(`${os.name} ${os.version}`)
      }
      if (browser.name && browser.version) {
        info.push(`${browser.name} ${browser.major || browser.version}`)
      }
      return info.length ? info.join(' / ') : (ua || 'Unknown user agent')
    }
  }
}
</script>

<style lang="scss" scoped>
.circle-dot {
  height: 10px;
  width: 10px;
  margin-left: 7px;
  background-color: $green;
  border-radius: 50%;
  display: inline-block;
}
</style>
