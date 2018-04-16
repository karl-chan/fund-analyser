<template lang="pug">
  q-modal(v-model="modalOpen" position="top" @show="onOpen")
    q-list
      q-list-header Active Sessions
      q-item(v-for="session in activeSessions" :key="session.encryptedId")
        q-item-side.text-center
          .circle-dot(v-if="session.current")
        q-item-main(:label="session.location.ip" :sublabel="'Location - ' + extractLocation(session)")
        q-item-side(right)
          q-item-tile(stamp) Expires {{$utils.format.formatFromNow(session.expiry)}}
          q-chip(v-if="session.current" square color="secondary" class="shadow-2") Current
          q-btn(v-else dense rounded icon="delete" @click="destroySession(session.encryptedId)")

</template>

<script>
import { mapState, mapActions } from 'vuex'
export default {
  name: 'ActiveSessions',
  props: ['open'],
  computed: {
    modalOpen: {
      get () {
        return this.open
      },
      set (open) {
        this.$emit('update:open', open)
      }
    },
    ...mapState('auth', ['activeSessions'])
  },
  methods: {
    onOpen () {
      this.getActiveSessions()
    },
    extractLocation (session) {
      const {city, country, region} = session.location
      if (!city && !country && !region) {
        return 'Unknown'
      }
      return [city, region, country].filter(x => x).join(', ')
    },
    ...mapActions('auth', ['getActiveSessions', 'destroySession'])
  }
}
</script>

<style lang="stylus" scoped>
@import '~variables'
  .circle-dot {
    height: 10px;
    width: 10px;
    background-color: $green;
    border-radius: 50%;
    display: inline-block;
  }
</style>
